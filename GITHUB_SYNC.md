# GitHub Sync Setup Guide

This guide explains how to set up GitHub synchronization for your study notes history.

## Overview

The GitHub sync feature allows you to:
- **Backup** your notes to GitHub (repository or Gist)
- **Restore** notes from GitHub
- **Sync** across multiple devices

## Setup Options

### Option 1: GitHub Repository

Store notes in a dedicated file in a GitHub repository.

#### Steps:

1. **Create a GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name like "Study Notes Sync"
   - Select scopes: `repo` (full control of private repositories)
   - Generate and copy the token

2. **Create a Repository** (optional, if you don't have one):
   - Create a new repository on GitHub (public or private)
   - Note the repository name in format: `username/repo-name`

3. **Set Environment Variables**:
   Add to your `.env.local` file:
   ```env
   GITHUB_TOKEN=your_personal_access_token_here
   GITHUB_REPO=username/repo-name
   ```

4. **Deploy to Vercel** (if using Vercel):
   - Go to your Vercel project settings
   - Add environment variables:
     - `GITHUB_TOKEN`: Your GitHub token
     - `GITHUB_REPO`: Your repository (e.g., `username/repo-name`)

### Option 2: GitHub Gist

Store notes in a private GitHub Gist (simpler, but limited to one file).

#### Steps:

1. **Create a GitHub Personal Access Token**:
   - Same as Option 1, but select scope: `gist` instead of `repo`

2. **Set Environment Variables**:
   Add to your `.env.local` file:
   ```env
   GITHUB_TOKEN=your_personal_access_token_here
   GITHUB_GIST_ID=optional_existing_gist_id
   ```
   
   Note: `GITHUB_GIST_ID` is optional. If not provided, a new gist will be created on first sync.

3. **Deploy to Vercel**:
   - Add environment variables:
     - `GITHUB_TOKEN`: Your GitHub token
     - `GITHUB_GIST_ID`: (Optional) Existing gist ID

## Usage

### From the History Page:

1. **Sync to GitHub**:
   - Select "Repository" or "Gist" mode
   - Click "Sync to GitHub"
   - Your notes will be uploaded to GitHub

2. **Fetch from GitHub**:
   - Select the same mode you used for syncing
   - Click "Fetch from GitHub"
   - Notes will be imported (merged with existing notes)

### API Endpoints

#### POST `/api/github-sync`
Sync notes to GitHub.

**Request Body**:
```json
{
  "notes": [...], // Array of SavedNote objects
  "mode": "repo" // or "gist"
}
```

**Response**:
```json
{
  "success": true,
  "url": "https://github.com/...",
  "message": "Notes synced successfully to GitHub"
}
```

#### GET `/api/github-sync?mode=repo`
Fetch notes from GitHub.

**Response**:
```json
{
  "success": true,
  "notes": [...] // Array of SavedNote objects
}
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit tokens to Git**:
   - Always use `.env.local` for local development
   - Use Vercel environment variables for production
   - Add `.env.local` to `.gitignore` (already done)

2. **Token Permissions**:
   - Use the minimum required scopes
   - For repositories: `repo` scope
   - For gists: `gist` scope only

3. **Token Rotation**:
   - Regularly rotate your tokens
   - Revoke old tokens when creating new ones

4. **Private vs Public**:
   - Repository: Can be private or public
   - Gist: Always private (when using the API)

## Troubleshooting

### "GITHUB_TOKEN not configured"
- Ensure the token is set in `.env.local` (local) or Vercel environment variables (production)
- Restart your development server after adding to `.env.local`

### "GITHUB_REPO not configured"
- Set `GITHUB_REPO` in format: `username/repo-name`
- Ensure the repository exists and the token has access

### "Failed to sync to repository"
- Check that the token has `repo` scope
- Verify the repository name is correct
- Ensure the token hasn't expired

### "Failed to sync to gist"
- Check that the token has `gist` scope
- If using `GITHUB_GIST_ID`, verify the gist exists and is accessible

### "Failed to fetch from GitHub"
- Check network connectivity
- Verify the token is still valid
- For repositories, ensure the file exists (first sync creates it)

## File Structure

### Repository Mode
Notes are stored in: `study-notes-history.json` at the root of the repository.

### Gist Mode
Notes are stored in a file named: `study-notes-history.json` within the gist.

## Best Practices

1. **Regular Backups**: Sync to GitHub regularly to avoid data loss
2. **Version Control**: Each sync creates a commit (repository) or updates the gist
3. **Multiple Devices**: Fetch from GitHub on new devices to sync your notes
4. **Export First**: Always export to JSON as a local backup before syncing

## Limitations

- **Repository Mode**: Requires a repository with write access
- **Gist Mode**: Limited to one file, but simpler setup
- **Rate Limits**: GitHub API has rate limits (5000 requests/hour for authenticated users)
- **File Size**: Large note collections may hit GitHub file size limits (100MB for repos, 1MB for gists)

## Alternative: Manual Export/Import

If you prefer not to use GitHub sync, you can:
1. Export notes as JSON from the History page
2. Store the JSON file in your own backup system (cloud storage, etc.)
3. Import the JSON file when needed

This gives you full control over where and how your notes are stored.

