import OpenAI from 'openai';

let groqClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables. Please add it to .env.local');
  }

  groqClient = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  return groqClient;
}

export async function generateStudyNotes(
  text: string,
  inputType: 'youtube' | 'video' | 'pdf' | 'docx' | 'pptx' | 'text',
  detailLevel: 'easy' | 'medium' | 'detailed' = 'medium'
): Promise<string> {
  try {
    const client = getClient();

    // Truncate text if too long
    // Using Llama 3.3 70B which has 128k context window.
    // Reserve ~4k tokens for output, leaving ~124k for input.
    // 124k tokens * ~4 chars/token = ~500k chars.
    // Safe limit: 100,000 characters (conservative to avoid rate limits on free tier)
    const maxLength = 100000;
    const truncatedText = text.length > maxLength
      ? text.substring(0, maxLength) + '\n\n[Content truncated due to length...]'
      : text;

    let systemPrompt = '';

    if (detailLevel === 'easy') {
      systemPrompt = `You are a helpful tutor creating easy-to-understand study notes.
      
Requirements:
1. **Structure**: Use clear H1 (#) for the main title and H2 (##) for major sections.
2. **Formatting**: Use **bold** for important terms and key concepts.
3. **Clarity**: Use simple language and short sentences.
4. **Layout**: Leave a blank line between every section and bullet point for readability.
5. **Content**: Focus on the "Big Picture" ideas. Use analogies.
6. **Summary**: End with a brief "Quick Summary" section.`;
    } else if (detailLevel === 'detailed') {
      systemPrompt = `You are an expert academic researcher and professor creating EXTREMELY COMPREHENSIVE and EXHAUSTIVE study notes. Your goal is to create the most detailed, thorough notes possible.

CRITICAL REQUIREMENTS:

1. **EXHAUSTIVE COVERAGE**:
   - Cover EVERY SINGLE concept, term, definition, and idea from the source material
   - Do NOT skip or summarize ANY content - expand on everything
   - Explain every sentence, every phrase, every technical term
   - If something is mentioned, explain it in full detail
   - Aim for MAXIMUM length and depth

2. **DEEP HIERARCHICAL STRUCTURE**:
   - Use H1 (#) for the main title
   - Use H2 (##) for major topics
   - Use H3 (###) for subtopics
   - Use H4 (####) for detailed points
   - Use H5 (#####) for sub-points if needed
   - Create as many sections and subsections as necessary

3. **COMPREHENSIVE EXPLANATIONS**:
   - Define EVERY technical term, concept, and jargon
   - Provide historical context and background for important concepts
   - Explain the "why" and "how" behind every idea
   - Include theoretical foundations and principles
   - Discuss implications, applications, and significance
   - Add relevant examples, case studies, and scenarios for each concept

4. **DETAILED FORMATTING**:
   - Use **bold** for ALL key terms, definitions, and important concepts
   - Use *italics* for emphasis and subtle distinctions
   - Use inline code for technical terms, formulas, or specific terminology
   - Use > blockquotes for important quotes or key insights
   - Use numbered lists (1., 2., 3.) for sequential processes or steps
   - Use bullet points (-, *) for related items and features

5. **THOROUGH ELABORATION**:
   - For each concept, provide:
     * Full definition with context
     * Detailed explanation (3-5 paragraphs minimum)
     * Multiple examples with step-by-step breakdowns
     * Comparisons with related concepts
     * Common misconceptions and clarifications
     * Practical applications and use cases
     * Advanced considerations and edge cases

6. **COMPREHENSIVE SECTIONS**:
   - **Introduction**: Detailed overview and context (multiple paragraphs)
   - **Background**: Historical development, origins, evolution
   - **Core Concepts**: In-depth explanation of each major idea
   - **Detailed Analysis**: Deep dive into mechanisms, processes, relationships
   - **Examples & Applications**: Multiple detailed, real-world examples
   - **Advanced Topics**: Complex aspects, nuances, special cases
   - **Relationships & Connections**: How concepts relate to each other
   - **Implications**: Significance, impact, consequences
   - **Summary**: Comprehensive recap of all major points
   - **Key Takeaways**: Detailed list of important insights

7. **MAXIMUM DETAIL LEVEL**:
   - Write as if teaching someone who needs to become an expert
   - Assume the reader wants to understand EVERYTHING deeply
   - Do NOT condense or abbreviate - expand everything
   - Include all nuances, subtleties, and fine details
   - Provide context for every statement
   - Explain relationships between different concepts

8. **QUALITY STANDARDS**:
   - Use academic and professional language
   - Maintain logical flow and organization
   - Ensure every paragraph adds substantial value
   - Cross-reference related sections when appropriate
   - Use transitional phrases for smooth reading

REMEMBER: The goal is to create the LONGEST, MOST DETAILED, MOST COMPREHENSIVE notes possible. Do not hold back - cover everything in extreme depth!`;
    } else {
      // Medium (Default)
      systemPrompt = `You are an expert study notes generator. Create clean, well-organized study notes.
      
Requirements:
1. **Structure**: Use standard Markdown headers (H1 #, H2 ##, H3 ###).
2. **Formatting**: **Bold** all key terms and definitions.
3. **Bullets**: Use bullet points for lists. Keep them concise.
4. **Spacing**: Ensure there is a blank line between all headers and paragraphs.
5. **Organization**: 
   - Start with a "Core Concepts" section.
   - Group details logically under relevant headers.
   - End with a "Key Takeaways" list.
6. **Style**: Professional, clear, and objective.`;
    }

    const userPrompt = `Input source: ${inputType}
Detail Level: ${detailLevel}

Content to process:
${truncatedText}

Generate the study notes now.`;

    console.log(`Sending request to Groq (Model: llama-3.1-8b-instant, Input length: ${truncatedText.length} chars)...`);

    try {
      const completion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.1-8b-instant', // Faster, more efficient model for free tier
        temperature: 0.5,
        max_tokens: detailLevel === 'detailed' ? 4096 : 2048, // Reduced to save tokens
      });

      const notes = completion.choices[0]?.message?.content || '';

      if (!notes || notes.trim().length === 0) {
        throw new Error('Generated notes are empty');
      }

      return notes;
    } catch (apiError: any) {
      console.error('Groq API Request Failed:', {
        message: apiError.message,
        type: apiError.type,
        code: apiError.code,
        param: apiError.param,
      });
      throw apiError;
    }
  } catch (error) {
    console.error('Groq API error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate notes: ${error.message}`);
    }
    throw new Error('Failed to generate notes: Unknown error');
  }
}
