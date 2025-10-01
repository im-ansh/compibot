import { AIModel } from "@/components/ModelSelector";

const OWNER_EMAIL = "aaronvanoss@gmail.com";
const OWNER_API_KEY = "AIzaSyCBBA-TOUfG0q47ulqLP29vwKPbjDbWzoc";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export interface Message {
  role: "user" | "model";
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>;
}

const getApiKey = (userEmail: string | null): string => {
  if (userEmail === OWNER_EMAIL) {
    return OWNER_API_KEY;
  }
  const storedKey = localStorage.getItem("gemini_api_key");
  if (!storedKey) {
    throw new Error("No API key found. Please add your API key in settings.");
  }
  return storedKey;
};

export const verifyApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
};

const PERSONA_PROMPTS: Record<string, string> = {
  helpful: "You are a helpful AI assistant. Provide clear, concise, and accurate responses.",
  creative: "You are a creative writing assistant. Provide imaginative, engaging, and artistic responses.",
  technical: "You are a technical expert. Provide detailed, precise, and technically accurate responses with code examples when relevant.",
  casual: "You are a friendly and casual AI companion. Keep responses warm, conversational, and easy to understand.",
  professional: "You are a professional business advisor. Provide formal, structured, and strategic responses.",
};

const getSystemPrompt = (model: AIModel, persona: string, customPrompt: string): string => {
  const basePrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.helpful;
  
  let modelPrompt = "";
  switch (model) {
    case "lightweight":
      modelPrompt = " Keep answers brief and to the point.";
      break;
    case "pro":
      modelPrompt = " Provide comprehensive, well-structured, and thoroughly explained responses with examples when appropriate.";
      break;
    case "giga":
      modelPrompt = " Analyze this topic from multiple perspectives and provide a thorough, comprehensive response.";
      break;
  }
  
  const finalPrompt = basePrompt + modelPrompt;
  return customPrompt ? `${finalPrompt}\n\nAdditional instructions: ${customPrompt}` : finalPrompt;
};

export const sendMessage = async (
  messages: Message[],
  model: AIModel,
  userEmail: string | null,
  persona: string = "helpful",
  customPrompt: string = ""
): Promise<string> => {
  const apiKey = getApiKey(userEmail);
  const systemPrompt = getSystemPrompt(model, persona, customPrompt);
  
  const formattedMessages = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...messages
  ];

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: formattedMessages,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get response from AI");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

export const sendGigaMessage = async (
  messages: Message[],
  model: AIModel,
  userEmail: string | null,
  persona: string = "helpful",
  customPrompt: string = ""
): Promise<string[]> => {
  const apiKey = getApiKey(userEmail);
  const systemPrompt = getSystemPrompt(model, persona, customPrompt);
  
  const formattedMessages = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...messages
  ];

  // Make 4 parallel requests
  const promises = Array(4).fill(null).map(() =>
    fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: formattedMessages,
      }),
    })
  );

  const responses = await Promise.all(promises);
  const results = await Promise.all(responses.map(r => r.json()));
  
  return results.map(data => data.candidates[0].content.parts[0].text);
};
