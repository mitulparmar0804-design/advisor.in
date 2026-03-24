import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateFinancialAdvice = async (prompt: string, context: any) => {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Context: ${JSON.stringify(context)}
      User Query: ${prompt}
      
      You are a professional Investment Advisor. Provide concise, objective, and personalized advice.
      If the user asks for investment advice, always include a disclaimer that this is not professional financial advice.
    `,
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
    }
  });

  const response = await model;
  return response.text;
};

export const analyzeExpenses = async (expenses: any[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these expenses and provide 3 actionable savings tips: ${JSON.stringify(expenses)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            tip: { type: Type.STRING },
            potentialSavings: { type: Type.STRING }
          },
          required: ["tip", "potentialSavings"]
        }
      }
    }
  });
  
  return JSON.parse(response.text);
};
