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

const getSystemPrompt = (model: AIModel): string => {
  switch (model) {
    case "lightweight":
      return "You are a helpful AI assistant. Provide quick, concise, and clear responses. Keep answers brief and to the point.";
    case "pro":
      return "You are an advanced AI assistant with expertise in detailed reasoning. Provide comprehensive, well-structured, and thoroughly explained responses with examples when appropriate.";
    case "giga":
      return "You are conducting in-depth research. Analyze this topic from multiple perspectives and provide a thorough, comprehensive response.";
    default:
      return "You are a helpful AI assistant.";
  }
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
  return data.candidates[0].content.parts[0].text;
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
  
  return results.map(data => data.candidates[0].content.parts[0].text);
};
