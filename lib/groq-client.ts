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
    // 15,000 characters is approx 3,500-4,000 tokens.
    // Combined with ~1,000 output tokens, this stays under the 6,000 TPM limit per request.
    const CHUNK_SIZE = 15000;
    const chunks = [];

    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.substring(i, i + CHUNK_SIZE));
    }

    console.log(`Processing content in ${chunks.length} chunks to ensure full coverage...`);

    let combinedNotes = '';

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;

      let systemPrompt = '';
      if (detailLevel === 'easy') {
        systemPrompt = `You are a helpful tutor creating easy-to-understand study notes. This is part ${i + 1} of ${chunks.length} of the content.`;
      } else if (detailLevel === 'detailed') {
        systemPrompt = `You are an expert academic researcher. Create EXTREMELY DETAILED notes. This is part ${i + 1} of ${chunks.length}. Cover every detail in this section.`;
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
            model: 'llama-3.1-8b-instant',
            temperature: 0.5,
            max_tokens: detailLevel === 'detailed' ? 2048 : 1024,
          });

          return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
          if (error.status === 429) {
            if (retries > 0) {
              console.warn(`Rate limit hit on chunk ${i + 1}. Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return makeRequest(retries - 1, delay * 2);
            }

            // If retries exhausted, try to fail gracefully for this chunk or throw
            throw new Error(`Rate limit reached during processing. Please wait a moment and try again.`);
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
