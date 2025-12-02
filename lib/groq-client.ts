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

    // Chunking strategy to avoid rate limits and ensure full coverage
    // 12,000 characters is approx 3,000 tokens.
    // Combined with ~1,000 output tokens, this stays under the 6,000 TPM limit per request.
    const CHUNK_SIZE = 12000;
    const CHUNK_OVERLAP = 500; // Overlap to maintain context between chunks
    const chunks = [];

    for (let i = 0; i < text.length; i += (CHUNK_SIZE - CHUNK_OVERLAP)) {
      chunks.push(text.substring(i, i + CHUNK_SIZE));
    }

    console.log(`Processing content in ${chunks.length} chunks to ensure full coverage...`);

    let combinedNotes = '';

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;

      let systemPrompt = '';
      if (detailLevel === 'easy') {
        systemPrompt = `You are a helpful tutor creating easy-to-understand study notes. This is part ${i + 1} of ${chunks.length} of the content. Focus on key concepts and simple explanations.`;
      } else if (detailLevel === 'detailed') {
        systemPrompt = `You are a meticulous academic archivist. Your goal is to create a VERBATIM-LEVEL COMPREHENSIVE record of the content.
        
CRITICAL INSTRUCTIONS FOR DETAILED MODE:
1. **CAPTURE EVERYTHING**: Do not summarize or condense. If a concept is explained, write down the full explanation.
2. **EVERY EXAMPLE**: Include every single example, analogy, or case study mentioned.
3. **NUMBERS & DATA**: specific numbers, dates, formulas, or statistics MUST be preserved exactly.
4. **NO SKIPPING**: Do not skip "introductory" or "side" remarks if they contain any context.
5. **STRUCTURE**: Use nested bullet points to show the hierarchy of every single thought.
6. **Completeness**: It is better to be too long than too short. The user wants to know EXACTLY what was said.
7. **EXPAND**: If a point is brief, expand on it using the context provided.

This is part ${i + 1} of ${chunks.length}. Treat this chunk as a critical document that needs to be fully preserved in note form.`;
      } else {
        systemPrompt = `You are an expert study notes generator. Create clean, organized notes. This is part ${i + 1} of ${chunks.length}.`;
      }

      const userPrompt = `Input source: ${inputType}
Detail Level: ${detailLevel}
Part: ${i + 1}/${chunks.length}

Content to process:
${chunk}

Generate detailed study notes for THIS PART ONLY. Maintain formatting.`;

      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);

      const makeRequest = async (retries = 3, delay = 5000): Promise<string> => {
        try {
          const completion = await client.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            // Use Llama 3.3 70B for better reasoning and detail
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3, // Lower temperature for more factual/verbatim output
            max_tokens: detailLevel === 'detailed' ? 6000 : 2048, // Increased limits
          });

          return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
          if (error.status === 429) {
            if (retries > 0) {
              console.warn(`Rate limit hit on chunk ${i + 1}. Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return makeRequest(retries - 1, delay * 2);
            }
            // ... (rest of error handling remains the same)
            let waitMessage = "You have reached the API rate limit.";
            const waitTimeMatch = error.message?.match(/try again in (\d+(\.\d+)?)s/);

            if (waitTimeMatch) {
              const seconds = parseFloat(waitTimeMatch[1]);
              if (seconds > 60) {
                const minutes = Math.ceil(seconds / 60);
                waitMessage = `Rate limit reached. Please wait approximately ${minutes} minutes before trying again to reset your quota.`;
              } else {
                waitMessage = `Rate limit reached. Please wait ${Math.ceil(seconds)} seconds before trying again.`;
              }
            } else {
              waitMessage = "Usage limit reached. Please wait 15-30 minutes for your quota to reset before trying again.";
            }

            const rateLimitError = new Error(waitMessage);
            (rateLimitError as any).status = 429;
            throw rateLimitError;
          }
          throw error;
        }
      };

      const chunkNotes = await makeRequest();
      combinedNotes += `\n\n--- Part ${i + 1} ---\n\n` + chunkNotes;

      // Add a small delay between chunks to be nice to the API
      if (!isLastChunk) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!combinedNotes || combinedNotes.trim().length === 0) {
      throw new Error('Generated notes are empty');
    }

    return combinedNotes;

  } catch (error) {
    console.error('Groq API error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate notes: ${error.message}`);
    }
    throw new Error('Failed to generate notes: Unknown error');
  }
}

export async function chatWithNotes(
  notes: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  userQuestion: string
): Promise<string> {
  try {
    const client = getClient();

    const systemPrompt = `You are a helpful AI tutor. The user has some study notes and wants to ask questions about them.
    
Context (Study Notes):
${notes}

Instructions:
1. Answer the user's question based PRIMARILY on the provided notes.
2. If the answer is not in the notes, you can use your general knowledge but mention that it's outside the notes.
3. Be concise, clear, and helpful.
4. Use markdown for formatting if needed.`;

    // Convert messages to OpenAI format
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add the new user question
    conversationHistory.push({
      role: 'user',
      content: userQuestion
    });

    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || 'I could not generate a response.';
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to chat: ${error.message}`);
    }
    throw new Error('Failed to chat: Unknown error');
  }
}
