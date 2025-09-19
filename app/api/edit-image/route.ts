import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { processImageForGemini } from '@/lib/image-utils';

// Configure maximum duration for this function
export const maxDuration = 300;

const editImageRequestSchema = z.object({
  imageBase64: z.string(),
  prompt: z.string(),
});

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = editImageRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos",
        },
        { status: 400 }
      );
    }

    const { imageBase64, prompt } = validation.data;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "La API de Gemini no está configurada",
        },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    try {
      console.log("Editando imagen con prompt:", prompt);
      
      // Process the image to ensure it's in a supported format
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const processedImage = await processImageForGemini(imageBuffer, 'image/jpeg'); // Assume JPEG if not specified
      
      // Convert to image data for Gemini
      const imageData = {
        inlineData: {
          data: processedImage.base64,
          mimeType: processedImage.mimeType
        }
      };
      
      // Send image and edit prompt to Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [
          {
            role: "user",
            parts: [
              imageData,
              { text: prompt }
            ]
          }
        ]
      });

      // Extract the generated image from response
      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log('✅ Imagen editada exitosamente');
            return NextResponse.json({
              success: true,
              imageBase64: part.inlineData.data,
            });
          }
        }
      }
      
      throw new Error("No se pudo generar la imagen editada");
      
    } catch (error) {
      console.error("Error editando imagen:", error);
      throw error;
    }

  } catch (error) {
    console.error("Error in edit-image API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al editar la imagen",
      },
      { status: 500 }
    );
  }
}