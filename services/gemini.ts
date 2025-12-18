
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface VisualElement {
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  description: string;
}

/**
 * Analyzes a page image to detect visual elements like diagrams, photos, and charts.
 */
export async function detectVisualElements(imageBase64: string): Promise<VisualElement[]> {
  const model = 'gemini-3-flash-preview';
  
  const prompt = "Identify all distinct diagrams, photos, charts, illustrations, and maps in this image. For each, provide a short label and precise bounding box coordinates.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Short title of the element" },
              box_2d: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER },
                description: "The bounding box [ymin, xmin, ymax, xmax] from 0 to 1000"
              },
              description: { type: Type.STRING, description: "A one-sentence summary of what this is." }
            },
            required: ["label", "box_2d", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Detection Error:", error);
    return [];
  }
}

/**
 * Provides a deep explanation for a specific extracted image.
 */
export async function explainExtractedImage(imageBase64: string, label: string): Promise<string> {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `This is an extracted visual element labeled "${label}". Please provide a detailed explanation of what is shown, including any data, text labels within the image, and its likely purpose or significance. Use markdown for formatting.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ]
    });

    return response.text || "No explanation could be generated.";
  } catch (error) {
    console.error("Explanation Error:", error);
    return "Error generating explanation.";
  }
}
