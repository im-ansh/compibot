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

const getSystemPrompt = (model: AIModel, persona: string, customPrompt: string, coFounderMode?: string): string => {
  if (model === "engineer") {
    return "You are a code generation expert. Respond ONLY with code. Do not include any explanations, comments, or text outside of the code itself. The code should be clean, well-structured, and ready to use.";
  }

  if (model === "co-founder") {
    if (coFounderMode === "user") {
      return "You are an expert UX/UI analyst and user retention specialist for SaaS and mobile apps. Analyze the uploaded screenshots and provide: 1) A user retention score out of 100, 2) Detailed insights about design quality, user flow, engagement elements, and potential friction points. Format your response as JSON with keys: score (number), insights (array of strings). Be critical but constructive.";
    }
    if (coFounderMode === "founder") {
      return "You are an experienced startup co-founder and product strategist. Engage in thoughtful discussions about product ideas, execution strategies, market fit, growth tactics, and business models. Ask probing questions, challenge assumptions constructively, and provide actionable advice based on startup best practices.";
    }
    if (coFounderMode === "idea") {
      return "You are a creative product manager specializing in SaaS and mobile app features. Based on the user's app idea, generate innovative, actionable feature suggestions that would enhance the product. Focus on user value, technical feasibility, and competitive differentiation. Provide features in a structured list with brief descriptions.";
    }
  }

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
  customPrompt: string = "",
  coFounderMode?: string
): Promise<string> => {
  const apiKey = getApiKey(userEmail);
  const systemPrompt = getSystemPrompt(model, persona, customPrompt, coFounderMode);
  
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
  customPrompt: string = "",
  coFounderMode?: string
): Promise<string[]> => {
  const apiKey = getApiKey(userEmail);
  const systemPrompt = getSystemPrompt(model, persona, customPrompt, coFounderMode);
  
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

export const sendAlphaMessage = async (
  messages: Message[],
  model: AIModel,
  userEmail: string | null,
  persona: string = "helpful",
  customPrompt: string = "",
  coFounderMode?: string
): Promise<string> => {
  const apiKey = getApiKey(userEmail);
  
  // Step 1: Use lightweight model with tool calling to improve the prompt
  const lastUserMessage = messages[messages.length - 1];
  const userPrompt = lastUserMessage.parts.find(p => 'text' in p)?.text || "";
  
  const improvePromptPayload = {
    contents: [
      { 
        role: "user", 
        parts: [{ 
          text: `Analyze and improve this user prompt to make it clearer and more effective for an AI to respond to. Return the improved prompt.\n\nOriginal prompt: ${userPrompt}` 
        }] 
      }
    ],
    tools: [
      {
        function_declarations: [
          {
            name: "improve_prompt",
            description: "Improve and enhance a user prompt for better AI responses",
            parameters: {
              type: "object",
              properties: {
                improved_prompt: {
                  type: "string",
                  description: "The enhanced and improved version of the original prompt"
                }
              },
              required: ["improved_prompt"]
            }
          }
        ]
      }
    ]
  };

  const improveResponse = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(improvePromptPayload),
  });

  if (!improveResponse.ok) {
    throw new Error("Failed to improve prompt");
  }

  const improveData = await improveResponse.json();
  const functionCall = improveData.candidates[0].content.parts[0].functionCall;
  const improvedPrompt = functionCall?.args?.improved_prompt || userPrompt;

  // Step 2: Send the improved prompt to get the final response
  const systemPrompt = getSystemPrompt(model, persona, customPrompt, coFounderMode);
  
  const finalMessages = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...messages.slice(0, -1),
    { role: "user", parts: [{ text: improvedPrompt }] }
  ];

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: finalMessages,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get response from AI");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
