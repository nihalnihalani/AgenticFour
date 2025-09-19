import { NextRequest, NextResponse } from 'next/server';
import { generateVideoScript } from '@/lib/gemini';
import {
  VideoScriptGenerationRequestSchema,
  type VideoScriptGenerationResponse
} from '@/lib/types';

export const maxDuration = 300;

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
    console.log("📥 Video script request body:", JSON.stringify(body, null, 2));

    const validation = VideoScriptGenerationRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("❌ Validation errors:", validation.error.errors);

      const errorMessages = validation.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      return NextResponse.json<VideoScriptGenerationResponse>(
        {
          success: false,
          error: `Invalid request data: ${errorMessages}`,
        },
        { status: 400 }
      );
    }

    const { productData, tone, duration, focusPoints } = validation.data;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json<VideoScriptGenerationResponse>(
        {
          success: false,
          error: "Gemini API is not configured. Please set GEMINI_API_KEY in environment variables.",
        },
        { status: 503 }
      );
    }

    try {
      console.log("Generating video script with Gemini...");
      const script = await generateVideoScript(productData, tone, duration, focusPoints);
      console.log("Video script generated successfully");

      return NextResponse.json<VideoScriptGenerationResponse>({
        success: true,
        script,
      });

    } catch (error) {
      console.error("Error generating video script:", error);

      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          return NextResponse.json<VideoScriptGenerationResponse>(
            {
              success: false,
              error: "Authentication error with Gemini. Check your API key.",
            },
            { status: 401 }
          );
        }

        if (error.message.includes("quota") || error.message.includes("limit")) {
          return NextResponse.json<VideoScriptGenerationResponse>(
            {
              success: false,
              error: "Gemini API quota exceeded. Please try again later.",
            },
            { status: 429 }
          );
        }
      }

      throw error;
    }

  } catch (error) {
    console.error("Error in generate-video-script API:", error);

    return NextResponse.json<VideoScriptGenerationResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error generating video script",
      },
      { status: 500 }
    );
  }
}