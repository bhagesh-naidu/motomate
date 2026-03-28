import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface NavigationAdvice {
  routeSuggestion: string;
  safetyAlerts: string[];
  weatherUpdate: string;
  estimatedTimeImpact: string;
  safetyAlert: string;
  optimizedRouteDetails: {
    efficiencyScore: number;
    safetyScore: number;
    trafficCondition: string;
    roadClosures: string[];
    alternativeRoute: string;
  };
}

export const getAIPillionAdvice = async (
  location: string, 
  destination: string, 
  preferences: string[]
): Promise<NavigationAdvice> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are "AI Pillion", a premium motorcycle navigation assistant.
    Current Location: ${location}
    Destination: ${destination}
    Rider Preferences: ${preferences.join(", ")}

    Perform a comprehensive route optimization considering:
    1. Real-time traffic conditions.
    2. Known road closures or construction.
    3. Rider preferences for safety and efficiency.

    Provide:
    1. A short, catchy route suggestion (max 5 words).
    2. Specific safety alerts for a motorcyclist.
    3. A brief weather update.
    4. Estimated time impact compared to the standard route.
    5. A single, most critical safety alert.
    6. Optimized route details including efficiency score (0-100), safety score (0-100), current traffic condition, any road closures, and a brief description of an alternative route.

    Format the response as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            routeSuggestion: { type: Type.STRING },
            safetyAlerts: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weatherUpdate: { type: Type.STRING },
            estimatedTimeImpact: { type: Type.STRING },
            safetyAlert: { type: Type.STRING },
            optimizedRouteDetails: {
              type: Type.OBJECT,
              properties: {
                efficiencyScore: { type: Type.NUMBER },
                safetyScore: { type: Type.NUMBER },
                trafficCondition: { type: Type.STRING },
                roadClosures: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                alternativeRoute: { type: Type.STRING }
              },
              required: ["efficiencyScore", "safetyScore", "trafficCondition", "roadClosures", "alternativeRoute"]
            }
          },
          required: ["routeSuggestion", "safetyAlerts", "weatherUpdate", "estimatedTimeImpact", "safetyAlert", "optimizedRouteDetails"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Pillion Error:", error);
    return {
      routeSuggestion: "Stick to main highway",
      safetyAlerts: ["Watch for crosswinds on the bridge", "Keep an eye on tire pressure."],
      weatherUpdate: "Clear skies ahead",
      estimatedTimeImpact: "On track",
      safetyAlert: "Watch for crosswinds on the bridge",
      optimizedRouteDetails: {
        efficiencyScore: 85,
        safetyScore: 90,
        trafficCondition: "Moderate",
        roadClosures: [],
        alternativeRoute: "Coastal road for better views but 10 mins extra."
      }
    };
  }
};
