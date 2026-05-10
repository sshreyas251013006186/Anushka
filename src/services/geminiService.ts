import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_PROMPT } from "../systemPrompt";

export async function sendMessage(
  message: string,
  chatSession: Chat | null
): Promise<{ text: string; newChatSession: Chat }> {
  // Ensure we have a valid key
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Initialize chat session if it doesn't exist
  let currentChat = chatSession;
  if (!currentChat) {
    currentChat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        topP: 0.9,
      },
    });
  }

  const response = await currentChat.sendMessage({ message });

  return {
    text: response.text || "Sorry, I could not generate a response.",
    newChatSession: currentChat,
  };
}
