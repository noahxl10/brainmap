import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIResponse(prompt: string): Promise<string> {
  if (!prompt.trim()) {
    return 'Please enter a prompt to get an AI response.';
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for a mind mapping application called BrAIn Map. Provide clear, concise, and useful responses to user prompts. Keep responses focused and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'No response generated.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return 'OpenAI API key is invalid. Please check your configuration.';
      } else if (error.message.includes('quota')) {
        return 'OpenAI API quota exceeded. Please check your usage limits.';
      } else if (error.message.includes('rate_limit')) {
        return 'Rate limit exceeded. Please wait a moment and try again.';
      }
      return `AI service error: ${error.message}`;
    }
    return 'Failed to generate AI response. Please try again.';
  }
}