
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { MODEL_SEARCH, MODEL_THINKING, MODEL_FAST, MODEL_TTS } from "../constants";
import { ItemType, AiDiagnosisResult, SearchResult, MapPlace, VehicleOcrResult, InventoryItem, Estimate } from "../types";


// 7. Vehicle Info Extraction from Image (OCR/Vision)
export const extractVehicleInfoFromImage = async (base64Image: string, mimeType: string): Promise<VehicleOcrResult> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_SEARCH,
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        {
          text: `Extract vehicle information from this image (License plate or VIN sticker). 
          Identify: Make, Model, Year, License Plate, VIN, and Color if visible.
          Return the data in JSON format.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            make: { type: Type.STRING },
            model: { type: Type.STRING },
            year: { type: Type.STRING },
            licensePlate: { type: Type.STRING },
            vin: { type: Type.STRING },
            color: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return {};
    return JSON.parse(text) as VehicleOcrResult;
  } catch (error) {
    console.error("Error extracting vehicle info:", error);
    return {};
  }
};

// 8. Voice to Estimate (Direct Item Generation)
export const voiceToEstimate = async (voiceTranscript: string, vehicleInfo: string): Promise<AiDiagnosisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_THINKING,
      contents: `
        You are a professional service advisor. A mechanic has provided a voice description of a vehicle's issues.
        Vehicle: ${vehicleInfo}
        Voice Transcript: ${voiceTranscript}
        
        Based on this transcript, generate a list of required parts and labor items for the estimate.
        Return the data in JSON format.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 16384 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING },
            analysis: { type: Type.STRING },
            suggestedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  partNumber: { type: Type.STRING },
                  type: { type: Type.STRING, enum: [ItemType.PART, ItemType.LABOR, ItemType.OTHER] },
                  estimatedPrice: { type: Type.NUMBER },
                  standardHours: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AiDiagnosisResult;
  } catch (error) {
    console.error("Error generating estimate from voice:", error);
    throw error;
  }
};

export async function optimizeInventory(items: InventoryItem[], estimates: Estimate[]): Promise<{ id: string, suggestedMin: number, reason: string }[]> {
  const inventoryData = items.map(i => ({ id: i.id, name: i.name, currentMin: i.minQuantity, currentStock: i.quantity }));
  const usageData = estimates
    .filter(e => e.status === 'COMPLETED')
    .flatMap(e => e.items)
    .filter(i => i.type === ItemType.PART)
    .map(i => ({ name: i.description, quantity: i.quantity }));

  const prompt = `
    Analyze the following inventory and usage data for an auto repair shop.
    Suggest optimized "Minimum Quantity" (reorder points) for each item based on their usage history.
    If an item is used frequently, suggest a higher minimum. If rarely used, suggest a lower one.
    
    Inventory: ${JSON.stringify(inventoryData)}
    Usage History (Completed Jobs): ${JSON.stringify(usageData)}
    
    Return a JSON array of objects with:
    - id: string (the item id)
    - suggestedMin: number
    - reason: string (brief explanation in Thai)
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            suggestedMin: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["id", "suggestedMin", "reason"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI optimization result", e);
    return [];
  }
}

export async function forecastRevenue(estimates: Estimate[]): Promise<{ month: string, forecastedRevenue: number, confidence: number, insights: string }[]> {
  const historicalData = estimates
    .filter(e => e.status === 'COMPLETED')
    .map(e => ({ date: e.receiptDate || e.date, total: e.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0) }));

  const prompt = `
    Based on the following historical revenue data for an auto repair shop, forecast the revenue for the next 3 months.
    Consider trends and seasonality if apparent.
    
    Historical Data: ${JSON.stringify(historicalData)}
    
    Return a JSON array of objects with:
    - month: string (e.g., "2024-04")
    - forecastedRevenue: number
    - confidence: number (0.0 to 1.0)
    - insights: string (brief explanation in Thai about the trend)
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.STRING },
            forecastedRevenue: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            insights: { type: Type.STRING }
          },
          required: ["month", "forecastedRevenue", "confidence", "insights"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI forecast result", e);
    return [];
  }
}

export async function generateStatusUpdate(estimate: Estimate): Promise<string> {
  const prompt = `
    Generate a polite and professional status update message for a customer whose car is being repaired.
    Vehicle: ${estimate.vehicle.make} ${estimate.vehicle.model} (${estimate.vehicle.licensePlate})
    Current Stage: ${estimate.repairStage || 'Queued'}
    Status: ${estimate.status}
    Items: ${estimate.items.map(i => i.description).join(', ')}
    
    The message should be in Thai, friendly, and reassuring.
    Include a summary of what has been done and what is next.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
  });

  return response.text || "";
}

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper functions for TTS audio decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// 1. Smart Parts Search (Uses Google Search Tool)
export const searchPartsPricing = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_SEARCH,
      contents: `Find current market prices and official OEM part numbers for: ${query}. 
      Specifically try to identify:
      1. Standard Market Price (Retail)
      2. Official Service Center Price (ราคาศูนย์)
      3. OEM/Manufacturer Part Number (เลขอะไหล่)
      4. Source website or store name
      5. URL to the product if available
      Focus on Thailand market. Use googleSearch to find the most accurate and up-to-date information. Return the data in JSON format.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Name of the product or part" },
              price: { type: Type.NUMBER, description: "Estimated market price in THB" },
              officialPrice: { type: Type.NUMBER, description: "Official service center price in THB if available" },
              partNumber: { type: Type.STRING, description: "OEM Part Number" },
              source: { type: Type.STRING, description: "Source website or store name" },
              link: { type: Type.STRING, description: "URL to the product if available" }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as SearchResult[];
  } catch (error) {
    console.error("Error searching parts:", error);
    return [];
  }
};

// 2. AI Mechanic Diagnosis (Uses Thinking Model)
export const diagnoseVehicleIssue = async (symptoms: string, vehicleInfo: string): Promise<AiDiagnosisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_THINKING,
      contents: `
        You are an expert senior automotive mechanic at a professional service center. 
        Vehicle: ${vehicleInfo}
        Symptoms: ${symptoms}
        
        1. Analyze the potential Root Cause (Thinking step).
        2. Suggest a list of repair items (parts and labor).
        3. For Labor items, estimate the "Standard Hours" (FRT) required for a professional mechanic.
        4. Estimate prices in THB based on typical Thailand market rates.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING, description: "Technical Root Cause Analysis (สาเหตุหลัก)" },
            analysis: { type: Type.STRING, description: "Detailed explanation and recommendation in Thai." },
            suggestedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Description of part or labor in Thai" },
                  partNumber: { type: Type.STRING, description: "Likely OEM Part Number" },
                  type: { type: Type.STRING, enum: [ItemType.PART, ItemType.LABOR, ItemType.OTHER] },
                  estimatedPrice: { type: Type.NUMBER, description: "Estimated cost in THB" },
                  standardHours: { type: Type.NUMBER, description: "Estimated standard labor hours (e.g., 1.5)" }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AiDiagnosisResult;
  } catch (error) {
    console.error("Error diagnosing issue:", error);
    throw error;
  }
};

// 3. Fast Description/Disclaimer Generator (Uses Flash Lite)
export const generateQuickText = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Generate a professional, short sentence in Thai for an automotive quotation. Context: ${prompt}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating text:", error);
    return "";
  }
};

// 4. Find Local Places (Uses Gemini Maps Grounding)
export const findNearbyPlaces = async (query: string, location?: { lat: number, lng: number }): Promise<MapPlace[]> => {
  try {
    const config: any = {
      tools: [{ googleMaps: {} }],
    };
    
    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Find 5 places for: ${query}. Return a list with names and addresses.`,
      config: config
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && chunks.length > 0) {
      const places: MapPlace[] = [];
      chunks.forEach((chunk: any) => {
        if (chunk.maps?.uri && chunk.maps?.title) {
           places.push({
             title: chunk.maps.title,
             address: "View on Map", 
             uri: chunk.maps.uri
           });
        } else if (chunk.web?.uri && chunk.web?.title) {
           places.push({
             title: chunk.web.title,
             address: "View Source", 
             uri: chunk.web.uri
           });
        }
      });
      return places;
    }
    return [];
  } catch (error) {
    console.error("Error finding places:", error);
    return [];
  }
};

// 5. Generate Professional Estimate Note (Context Aware)
export const generateEstimateNote = async (context: { customerName: string, vehicleInfo: string, itemsList: string }): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `
        You are an assistant at a professional car repair center. Write a "Notes" section (หมายเหตุ) for a repair estimate in Thai language.
        
        Information:
        - Customer: ${context.customerName}
        - Vehicle: ${context.vehicleInfo}
        - Repairs: ${context.itemsList}
        
        Include:
        1. Price validity (e.g., 15 days).
        2. Warranty details on parts/labor (e.g., 3 months / 5,000 km).
        3. A polite closing sentence thanking the customer.
        
        Output only the text for the note, no markdown formatting or headers.
      `,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating note:", error);
    return "";
  }
};

// 6. Text to Speech for Thai/English notes
export const speakText = async (text: string): Promise<void> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioCtx,
      24000,
      1,
    );
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (error) {
    console.error("Error generating speech:", error);
  }
};
