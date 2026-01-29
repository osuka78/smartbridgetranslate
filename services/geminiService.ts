
import { GoogleGenAI, Type } from "@google/genai";
import { CritiqueResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const translateAuto = async (text: string): Promise<string> => {
  if (!text.trim()) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following English message into natural, conversational Japanese. 
      Maintain any paragraph breaks and the original tone (e.g., formal/informal). 
      Text: "${text}"`,
      config: {
        temperature: 0.1,
      },
    });
    return response.text || "翻訳に失敗しました";
  } catch (error) {
    console.error("Auto Translation Error:", error);
    return "エラーが発生しました";
  }
};

export const translateAndCritique = async (japaneseText: string, contextText: string): Promise<CritiqueResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context (Partner's message in English): "${contextText}"
      My Reply (in Japanese): "${japaneseText}"`,
      config: {
        systemInstruction: `You are a professional cross-cultural communication expert. 
        Your task is to:
        1. Translate the Japanese reply into natural, high-quality English that fits the context. Preserve line breaks.
        2. Provide a "Back-translation" (戻し翻訳): Translate your English translation back into Japanese literally so the user can verify the nuance.
        3. Evaluate if the reply is socially appropriate and polite.
        4. Provide a critique in Japanese.
        5. Provide 2-3 alternative English suggestions with Japanese labels explaining when they are appropriate (e.g., "より丁寧", "よりカジュアル", "ビジネス向け").
        6. For each suggestion, also provide a "Back-translation" (戻し翻訳) in Japanese so the user can see exactly how the nuance changes.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING, description: "The primary English translation" },
            backTranslation: { type: Type.STRING, description: "Japanese literal translation of the English result" },
            isAppropriate: { type: Type.BOOLEAN, description: "True if appropriate" },
            critique: { type: Type.STRING, description: "Explanation in Japanese" },
            suggestions: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "The alternative English text" },
                  label: { type: Type.STRING, description: "Japanese label for the context, e.g., 'より丁寧'" },
                  backTranslation: { type: Type.STRING, description: "Japanese literal translation of this specific suggestion" }
                },
                required: ["text", "label", "backTranslation"]
              }
            },
          },
          required: ["translatedText", "backTranslation", "isAppropriate", "critique", "suggestions"]
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      originalText: japaneseText,
      ...result
    };
  } catch (error) {
    console.error("Critique Error:", error);
    throw error;
  }
};
