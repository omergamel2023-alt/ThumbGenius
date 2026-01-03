import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

export interface ThumbnailData {
  topic: string;
  hasText: boolean;
  textMode: 'manual' | 'ai';
  customText: string;
  language: string;
  emotion: string;
  lighting: string;
  composition: string;
  cameraAngle: string;
  artStyle: string;
  aspectRatio: string;
  referenceImageAnalysis?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeneratorService {
  private genAI: GoogleGenAI;

  constructor() {
    // The key is loaded from the .env file in the root directory
    const apiKey = process.env['API_KEY'] || '';
    
    if (!apiKey) {
      console.warn('ThumbGenius: API_KEY is missing. Please add it to the .env file in the root directory.');
    }

    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates a catchy hook using Gemini Flash 2.5
   */
  async generateCatchyHook(topic: string, language: string): Promise<string> {
    if (!process.env['API_KEY']) return "WATCH THIS!";

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, punchy, high-CTR text overlay (2-4 words max) for a YouTube thumbnail about: "${topic}". Language: ${language}. Output ONLY the text, no quotes.`,
      });
      return response.text.trim();
    } catch (error) {
      console.error("Hook generation failed", error);
      return "SHOCKING TRUTH!";
    }
  }

  /**
   * Analyzes an uploaded image to extract deeper style keywords for reconstruction.
   */
  async analyzeImageStyle(base64Image: string): Promise<string> {
    if (!process.env['API_KEY']) return "Cinematic lighting, high contrast, 8k resolution";

    try {
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            { text: "Analyze this image specifically for a Midjourney prompt. DETAILED EXTRACTION REQUIRED:\n1. Color Palette (e.g., 'Teal and Orange', 'Cyberpunk Neon', 'Desaturated Earth Tones').\n2. Lighting Patterns (e.g., 'Rembrandt', 'Volumetric Fog', 'Rim Lighting').\n3. Composition Rules (e.g., 'Rule of Thirds', 'Golden Ratio', 'Symmetrical').\n\nOutput a concise summary describing these specific elements so a prompt engineer can replicate the exact 'vibe'." }
          ]
        }
      });
      return response.text.trim();
    } catch (error) {
      console.error("Image analysis failed", error);
      return "Professional studio lighting, 8k resolution, cinematic depth of field, high dynamic range";
    }
  }

  /**
   * Uses Gemini to construct a highly detailed, legendary Midjourney prompt.
   * This version is much more verbose and strict about using the reference analysis.
   */
  async generateDetailedPrompt(data: ThumbnailData, hook: string): Promise<string> {
    if (!process.env['API_KEY']) {
      return this.fallbackBuildPrompt(data, hook);
    }

    try {
      const textInstruction = data.hasText 
        ? `Include a bold, high-contrast text overlay in the foreground that says "${hook}". Font style: Modern, Impactful, Sans-Serif, glowing edges.` 
        : `Do not include any text overlay.`;

      const styleRef = data.referenceImageAnalysis 
        ? `*** CRITICAL STYLE OVERRIDE ***\nThe user provided a reference image. You MUST replicate its style based on this analysis: "${data.referenceImageAnalysis}".\nIgnore the standard Lighting/Composition settings if they conflict with this analysis.` 
        : `VISUAL STYLE: ${data.artStyle}, Hyper-realistic, 8k resolution, Unreal Engine 5 render style, vivid colors, high contrast, ray tracing.`;

      const prompt = `
        Act as a Lead Prompt Engineer for Midjourney v6.
        Your task is to convert the user's brief into a single, comprehensive, and "Legendary" grade image prompt.
        
        CREATIVE BRIEF:
        - Topic: ${data.topic}
        - Core Emotion: ${data.emotion} (Make it exaggerated, high stakes)
        - Desired Lighting: ${data.lighting}
        - Composition: ${data.composition}
        - Camera Angle: ${data.cameraAngle}
        - Art Style: ${data.artStyle}
        
        ${styleRef}
        
        INSTRUCTIONS for PROMPT CONSTRUCTION:
        1.  **Subject Focus**: Start by describing the main subject in extreme detail. Focus on the ${data.emotion} expression, eyes, skin texture, and dynamic pose.
        2.  **Environment & Story**: Describe the background details that scream "${data.topic}". Add atmospheric particles, depth, and context.
        3.  **Style Integration**: Seamlessly weave the lighting, camera angle, and art style into the visual description. If a reference analysis is provided, PRIORITIZE its color palette and lighting.
        4.  **Text Integration**: ${textInstruction}
        5.  **Technical Polish**: Use keywords like "photorealistic", "octane render", "volumetric fog", "cinematic", "highly detailed".
        6.  **Formatting**: Output ONE single paragraph prompt.
        7.  **Parameters**: Append strictly at the end: --ar ${data.aspectRatio} --v 6.0 --stylize 750 --style raw
        
        Output ONLY the final prompt string.
      `;

      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.9 // Higher temp for more creative "Legendary" flair
        }
      });

      return response.text.trim();
    } catch (error) {
      console.error("Prompt generation failed", error);
      return this.fallbackBuildPrompt(data, hook);
    }
  }

  // Fallback string concatenation method
  private fallbackBuildPrompt(data: ThumbnailData, hook: string): string {
    const segments = [];
    let subject = `A YouTube thumbnail featuring a ${data.emotion.toLowerCase()} subject regarding ${data.topic}`;
    segments.push(subject);
    segments.push(`highly detailed, expressive facial features, dynamic action pose`);
    segments.push(`${data.cameraAngle}, ${data.artStyle}`);
    if (data.hasText) {
      segments.push(`large bold text overlay saying "${hook}"`);
    }
    if (data.referenceImageAnalysis) {
      segments.push(`style inspired by: ${data.referenceImageAnalysis}`);
    } else {
      segments.push(`${data.lighting}, ${data.composition}`);
    }
    segments.push(`--ar ${data.aspectRatio} --v 6.0 --style raw --stylize 250`);
    return segments.join(", ");
  }
}