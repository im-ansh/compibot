import { AIModel } from "@/components/ModelSelector";

const OWNER_EMAIL = "aaronvanoss@gmail.com";
const OWNER_API_KEY = "AIzaSyCBBA-TOUfG0q47ulqLP29vwKPbjDbWzoc";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export interface Message {
  role: "user" | "model";
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>;
  images?: string[];
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

const getSystemPrompt = (model: AIModel): string => {
  const personaId = localStorage.getItem("ai_persona") || "helpful";
  const customPrompt = localStorage.getItem("custom_prompt") || "";
  
  const personas: Record<string, string> = {
    helpful: "You are a helpful AI assistant. Provide clear, concise, and accurate responses.",
    creative: "You are a creative AI assistant. Provide imaginative, engaging, and artistic responses with vivid descriptions.",
    technical: "You are a technical AI assistant. Provide detailed, precise, and technical responses with code examples when relevant.",
    friendly: "You are a friendly AI companion. Provide warm, conversational, and empathetic responses.",
    concise: "You are a concise AI advisor. Provide brief, to-the-point responses without unnecessary elaboration.",
  };

  let basePrompt = personas[personaId] || personas.helpful;
  
  switch (model) {
    case "lightweight":
      basePrompt += " Keep answers brief and to the point.";
      break;
    case "pro":
      basePrompt += " Provide comprehensive, well-structured responses with examples when appropriate.";
      break;
    case "giga":
      basePrompt += " Analyze topics from multiple perspectives and provide thorough, comprehensive responses.";
      break;
  }

  if (customPrompt) {
    basePrompt += ` Additional instructions: ${customPrompt}`;
  }

  return basePrompt;
};

export const sendMessage = async (
  messages: Message[],
  model: AIModel,
  userEmail: string | null
): Promise<string> => {
  const apiKey = getApiKey(userEmail);
  const systemPrompt = getSystemPrompt(model);
  
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
  const candidate = data.candidates[0];
  const parts = candidate.content.parts;
  
  // Extract text and images
  const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n");
  const imageParts = parts.filter((p: any) => p.inline_data).map((p: any) => 
    `data:${p.inline_data.mime_type};base64,${p.inline_data.data}`
  );
  
  return JSON.stringify({ text: textParts, images: imageParts });
};

export const sendGigaMessage = async (
  messages: Message[],
  userEmail: string | null
): Promise<string[]> => {
  const apiKey = getApiKey(userEmail);
  const systemPrompt = getSystemPrompt("giga");
  
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
  
  return results.map(data => {
    const parts = data.candidates[0].content.parts;
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n");
    const imageParts = parts.filter((p: any) => p.inline_data).map((p: any) => 
      `data:${p.inline_data.mime_type};base64,${p.inline_data.data}`
    );
    return JSON.stringify({ text: textParts, images: imageParts });
  });
};
