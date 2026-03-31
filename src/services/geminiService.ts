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

export interface EstimatedExpenses {
  fuel: number;
  food: number;
  accommodation: number;
  maintenance: number;
  other: number;
  total: number;
  currency: string;
  breakdown: string;
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
    1. Real-time traffic conditions and road hazards.
    2. Known road closures, construction, or accidents.
    3. Specific rider preferences for safety, scenery, and efficiency.
    4. Current weather conditions along the route.

    Provide a detailed response with:
    1. A short, catchy route suggestion (max 5 words).
    2. A list of specific safety alerts for a motorcyclist (e.g., crosswinds, slippery surfaces, high traffic areas).
    3. A brief weather update for the route.
    4. Estimated time impact compared to the standard route (e.g., "+10 mins", "-5 mins", "No impact").
    5. A single, most critical safety alert.
    6. Optimized route details including:
       - Efficiency score (0-100)
       - Safety score (0-100)
       - Current traffic condition (e.g., "Light", "Moderate", "Heavy")
       - Any specific road closures or major delays
       - A brief description of an alternative route based on the preferences.

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

export const estimateTripExpenses = async (
  start: string,
  end: string,
  bikeModel: string,
  mileage: string
): Promise<EstimatedExpenses> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are an expert motorcycle trip planner. 
    Estimate the total expenses for a motorcycle trip from "${start}" to "${end}".
    Bike Model: ${bikeModel}
    Expected Mileage: ${mileage}

    Consider:
    1. Fuel costs based on distance and current average fuel prices in the region.
    2. Food and hydration for the duration of the trip.
    3. Accommodation if the trip is long (over 400km).
    4. Basic maintenance/buffer for the distance.
    5. Miscellaneous expenses.

    Provide the estimate in the local currency of the region (e.g., INR for India, USD for USA).
    
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
            fuel: { type: Type.NUMBER },
            food: { type: Type.NUMBER },
            accommodation: { type: Type.NUMBER },
            maintenance: { type: Type.NUMBER },
            other: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            breakdown: { type: Type.STRING }
          },
          required: ["fuel", "food", "accommodation", "maintenance", "other", "total", "currency", "breakdown"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Expense Estimation Error:", error);
    return {
      fuel: 500,
      food: 300,
      accommodation: 0,
      maintenance: 100,
      other: 100,
      total: 1000,
      currency: "INR",
      breakdown: "Estimated based on standard rates. AI estimation failed."
    };
  }
};
