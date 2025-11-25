import { GoogleGenAI } from "@google/genai";
import { UserProfile, CycleData, DailyLog } from "../types";

// NOTE: In a real app, never expose API keys on the client. 
// This should go through a proxy server. 
// For this demo, we assume process.env.API_KEY is available.
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getWellnessInsight = async (
  user: UserProfile, 
  cycle: CycleData, 
  todaysLog: DailyLog
): Promise<string> => {
  if (!API_KEY) return "AI insights are unavailable without an API Key.";

  const prompt = `
    You are a helpful, empathetic period tracking assistant named KIMI.
    Analyze the following anonymous data and provide a short, single-paragraph wellness tip (max 50 words).
    Do not give medical advice. Focus on wellness, hydration, and stress management.
    
    User Profile:
    - Professional: ${user.isProfessional ? 'Yes' : 'No'}
    - Habits: Sleep: ${user.habits.sleep ? 'Good' : 'Irregular'}, Stress: ${user.habits.stress ? 'High' : 'Low'}
    
    Cycle Status:
    - Cycle Length: ${cycle.cycleLength} days
    
    Today's Log:
    - Water: ${todaysLog.waterIntake} glasses
    - Symptoms: ${todaysLog.symptoms.join(', ') || 'None'}
    - Mood: ${todaysLog.mood || 'Not recorded'}
    
    Tone: Caring, sisterly, encouraging.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Stay hydrated and take care of yourself today!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights right now. Remember to drink water!";
  }
};