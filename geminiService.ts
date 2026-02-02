
import { GoogleGenAI } from "@google/genai";
import { Language } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFinancialAdvice = async (userName: string, contributionAmount: number, language: Language) => {
  const langMap = { 
    en: "English", 
    fr: "French", 
    rw: "Kinyarwanda"
  };
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, encouraging financial tip for ${userName} who is part of the "Ishyirahamwe Twangumugayo" (a Rwandan savings group / Ibimina) contributing ${contributionAmount} RWF weekly. The advice MUST be written in ${langMap[language]}. Keep it under 50 words and culturally relevant.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating advice:", error);
    const defaults = {
        en: "Keep saving consistently to reach your financial goals with Ishyirahamwe Twangumugayo!",
        fr: "Continuez à épargner régulièrement pour atteindre vos objectifs financiers avec Ishyirahamwe Twangumugayo !",
        rw: "Komeza uzigame neza kugira ngo ugere ku ntego zawe muri Ishyirahamwe Twangumugayo!"
    };
    return defaults[language];
  }
};

export const draftAnnouncement = async (topic: string, language: Language) => {
  const langMap = { 
    en: "English", 
    fr: "French", 
    rw: "Kinyarwanda"
  };
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft a professional and friendly announcement for the "Ishyirahamwe Twangumugayo" savings group admin regarding this topic: "${topic}". The message MUST be written in ${langMap[language]}. The message should be polite, community-focused, and clear.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error drafting announcement:", error);
    return "";
  }
};
