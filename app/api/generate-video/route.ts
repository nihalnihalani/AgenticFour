import { NextRequest, NextResponse } from 'next/server';
import { generateVideoWithVeo3, enhanceProductImageWithNanoBanana } from '@/lib/fal';
import { ImageProcessor } from '@/lib/image-processor';
import {
  VideoGenerationRequestSchema,
  type VideoGenerationResponse
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
    console.log("📥 Video generation request:", JSON.stringify(body, null, 2));

    const validation = VideoGenerationRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation errors:", validation.error.errors);
      return NextResponse.json<VideoGenerationResponse>(
        {
          success: false,
          error: "Invalid request data. Please check the video generation parameters.",
        },
        { status: 400 }
      );
    }

    const { productData, avatar, configuration, script } = validation.data;
    const selectedImageUrls = body.selectedImageUrls as string[] || [];

    // Check if FAL_KEY is configured
    if (!process.env.FAL_KEY) {
      return NextResponse.json<VideoGenerationResponse>(
        {
          success: false,
          error: "Fal.ai API is not configured. Please set FAL_KEY in environment variables.",
        },
        { status: 503 }
      );
    }

    // Ensure we have a product image
    if (!productData.imageUrl) {
      return NextResponse.json<VideoGenerationResponse>(
        {
          success: false,
          error: "Product image is required for video generation.",
        },
        { status: 400 }
      );
    }

    // Ensure we have a script
    if (!script) {
      return NextResponse.json<VideoGenerationResponse>(
        {
          success: false,
          error: "Video script is required for video generation.",
        },
        { status: 400 }
      );
    }

    try {
      console.log("Starting video generation process...");
      console.log("Product:", productData.title);
      console.log("Avatar:", avatar.name);
      console.log("Configuration:", configuration);

      // Process and validate the product image URL
      console.log("🔍 Processing product image URL...");
      console.log("📸 Product image URL:", productData.imageUrl);
      
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
        
      const imageProcessingResult = await ImageProcessor.processImageUrl(productData.imageUrl, baseUrl);
      
      console.log("🔍 Image processing result:", {
        isValid: imageProcessingResult.isValid,
        processingMethod: imageProcessingResult.processingMethod,
        originalUrl: imageProcessingResult.originalUrl,
        processedUrl: imageProcessingResult.processedUrl,
        error: imageProcessingResult.error
      });
      
      if (!imageProcessingResult.isValid) {
        console.error("❌ Product image processing failed:", imageProcessingResult.error);
        return NextResponse.json<VideoGenerationResponse>(
          {
            success: false,
            error: `Product image processing failed: ${imageProcessingResult.error}`,
          },
          { status: 400 }
        );
      }

      console.log(`✅ Product image processed successfully using ${imageProcessingResult.processingMethod} method`);
      if (imageProcessingResult.processingMethod !== 'original') {
        console.log(`📸 Original URL: ${imageProcessingResult.originalUrl}`);
        console.log(`📸 Processed URL: ${imageProcessingResult.processedUrl}`);
      }

      let imageUrl = imageProcessingResult.processedUrl;

      // Process and validate avatar image URL if it exists
      if (avatar.videoImageUrl || avatar.imageUrl) {
        console.log("🎭 Processing avatar image URL...");
        const avatarImageUrl = avatar.videoImageUrl || avatar.imageUrl;
        const avatarProcessingResult = await ImageProcessor.processAvatarImageUrl(avatarImageUrl, baseUrl);
        
        if (avatarProcessingResult.isValid) {
          console.log(`✅ Avatar image processed successfully using ${avatarProcessingResult.processingMethod} method`);
          if (avatarProcessingResult.processingMethod !== 'original') {
            console.log(`🎭 Original avatar URL: ${avatarProcessingResult.originalUrl}`);
            console.log(`🎭 Processed avatar URL: ${avatarProcessingResult.processedUrl}`);
          }
          
          // Use avatar image as primary if available and valid
          imageUrl = avatarProcessingResult.processedUrl;
          console.log("🎭 Using processed avatar image as primary for video generation");
        } else {
          console.warn("⚠️ Avatar image processing failed, using product image:", avatarProcessingResult.error);
        }
      }

      // Optional: Enhance the product image for better video quality
      try {
        console.log("Attempting to enhance product image...");
        const productSpecificPrompt = `enhance image quality, improve lighting and colors for professional product photography of ${productData.title}, make it suitable for video generation, ensure the product is clearly visible and prominent, optimize for video presentation`;

        const enhancedImageUrl = await enhanceProductImageWithNanoBanana(
          imageUrl,
          productSpecificPrompt
        );
        imageUrl = enhancedImageUrl;
        console.log("✅ Product image enhanced successfully");
      } catch (enhanceError) {
        console.warn("⚠️ Image enhancement failed, using original image:", enhanceError);
        // Continue with original image if enhancement fails
      }

      // Generate video using Fal.ai Veo3
      console.log("Generating video with Veo3...");
      console.log("📸 Selected images for video:", selectedImageUrls.length);

      const videoUrl = await generateVideoWithVeo3(
        imageUrl,
        script,
        avatar,
        configuration,
        selectedImageUrls
      );

      console.log("✅ Video generated successfully");

      return NextResponse.json<VideoGenerationResponse>({
        success: true,
        videoUrl,
        script,
      });

    } catch (error) {
      console.error("❌ Error generating video:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error message:", error instanceof Error ? error.message : 'Unknown error');
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack');

      if (error instanceof Error) {
        // Handle specific Fal.ai errors
        if (error.message.includes("API key") || error.message.includes("credentials")) {
          return NextResponse.json<VideoGenerationResponse>(
            {
              success: false,
              error: "Authentication error with Fal.ai. Check your FAL_KEY.",
            },
            { status: 401 }
          );
        }

        if (error.message.includes("quota") || error.message.includes("limit")) {
          return NextResponse.json<VideoGenerationResponse>(
            {
              success: false,
              error: "Fal.ai API quota exceeded. Please try again later.",
            },
            { status: 429 }
          );
        }

        if (error.message.includes("image") || error.message.includes("Image not found")) {
          return NextResponse.json<VideoGenerationResponse>(
            {
              success: false,
              error: "Could not process the product image. Please ensure the image URL is valid and accessible.",
            },
            { status: 400 }
          );
        }

        if (error.message.includes("422") || error.message.includes("Unprocessable")) {
          return NextResponse.json<VideoGenerationResponse>(
            {
              success: false,
              error: `Fal.ai validation error: ${error.message}`,
            },
            { status: 422 }
          );
        }
      }

      return NextResponse.json<VideoGenerationResponse>(
        {
          success: false,
          error: `Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in generate-video API:", error);

    return NextResponse.json<VideoGenerationResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error generating video",
      },
      { status: 500 }
    );
  }
}