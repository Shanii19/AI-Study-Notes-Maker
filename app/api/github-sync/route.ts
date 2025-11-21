/**
 * API route for syncing study notes history to GitHub
 * Supports both GitHub repositories and GitHub Gists
 */

import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // Format: "username/repo-name"
const GITHUB_GIST_ID = process.env.GITHUB_GIST_ID; // Optional: Gist ID for updates

interface SyncRequest {
  notes: any[]; // SavedNote array
  mode: 'repo' | 'gist';
}

/**
 * Sync notes to a GitHub repository
 */
async function syncToRepo(notes: any[], repo: string): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!GITHUB_TOKEN) {
    return { success: false, error: 'GITHUB_TOKEN not configured' };
  }

  if (!repo) {
    return { success: false, error: 'GITHUB_REPO not configured' };
  }

  try {
    const content = JSON.stringify(notes, null, 2);
    const contentBase64 = Buffer.from(content).toString('base64');

    // Get the current file SHA if it exists
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${repo}/contents/study-notes-history.json`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }
    } catch (error) {
      // File doesn't exist yet, that's okay
    }

    // Create or update the file
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repo}/contents/study-notes-history.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update study notes history - ${new Date().toISOString()}`,
          content: contentBase64,
          sha, // Include SHA for updates
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to sync to repository' };
    }

    const result = await response.json();
    return {
      success: true,
      url: result.content.html_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync notes to a GitHub Gist
 */
async function syncToGist(notes: any[], gistId?: string): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!GITHUB_TOKEN) {
    return { success: false, error: 'GITHUB_TOKEN not configured' };
  }

  try {
    const content = JSON.stringify(notes, null, 2);

    const gistData: any = {
      description: 'Study Notes History - Auto-synced',
      public: false, // Private gist
      files: {
        'study-notes-history.json': {
          content,
        },
      },
    };

    const url = gistId
      ? `${GITHUB_API_BASE}/gists/${gistId}` // Update existing gist
      : `${GITHUB_API_BASE}/gists`; // Create new gist

    const response = await fetch(url, {
      method: gistId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gistData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to sync to gist' };
    }

    const result = await response.json();
    return {
      success: true,
      url: result.html_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET: Fetch notes from GitHub
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'repo';

  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    if (mode === 'repo') {
      if (!GITHUB_REPO) {
        return NextResponse.json(
          { error: 'GITHUB_REPO not configured' },
          { status: 400 }
        );
      }

      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/study-notes-history.json`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ notes: [] }); // No file yet
        }
        throw new Error('Failed to fetch from repository');
      }

      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const notes = JSON.parse(content);

      return NextResponse.json({ success: true, notes });
    } else {
      // Gist mode
      if (!GITHUB_GIST_ID) {
        return NextResponse.json(
          { error: 'GITHUB_GIST_ID not configured' },
          { status: 400 }
        );
      }

      const response = await fetch(
        `${GITHUB_API_BASE}/gists/${GITHUB_GIST_ID}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch from gist');
      }

      const gistData = await response.json();
      const file = gistData.files['study-notes-history.json'];
      
      if (!file) {
        return NextResponse.json({ notes: [] });
      }

      const notes = JSON.parse(file.content);
      return NextResponse.json({ success: true, notes });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch notes from GitHub',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Sync notes to GitHub
 */
export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured in environment variables' },
      { status: 500 }
    );
  }

  try {
    const body: SyncRequest = await request.json();
    const { notes, mode } = body;

    if (!Array.isArray(notes)) {
      return NextResponse.json(
        { error: 'Invalid request: notes must be an array' },
        { status: 400 }
      );
    }

    let result;
    if (mode === 'repo') {
      result = await syncToRepo(notes, GITHUB_REPO || '');
    } else {
      result = await syncToGist(notes, GITHUB_GIST_ID);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'Notes synced successfully to GitHub',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to sync notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

