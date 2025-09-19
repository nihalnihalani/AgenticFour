import { fal } from "@fal-ai/client";
import type { VideoScript, VideoAvatar, VideoConfiguration } from "./types";

const getFalClient = () => {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error("FAL_KEY is not configured");
  }

  fal.config({
    credentials: apiKey
  });

  return fal;
};

export async function generateVideoWithVeo3(
  productImageUrl: string,
  script: VideoScript,
  avatar: VideoAvatar,
  configuration: VideoConfiguration,
  selectedImageUrls?: string[]
): Promise<string> {
  const client = getFalClient();

  // Prepare primary image - use avatar image if available, otherwise main product image
  let primaryImageUrl = productImageUrl;

  // If avatar has a video-specific image, use that as the primary image
  if (avatar.videoImageUrl || avatar.imageUrl) {
    primaryImageUrl = avatar.videoImageUrl || avatar.imageUrl;
    console.log("🎭 Using avatar image as primary:", primaryImageUrl);
  }

  // Create a detailed prompt that includes information about all selected images
  const videoPrompt = createVideoPrompt(script, avatar, productImageUrl, selectedImageUrls);

  console.log("🎬 Generating video with Veo3...");
  console.log("📝 Video prompt:", videoPrompt);
  console.log("🖼️ Primary image URL:", primaryImageUrl);
  console.log("🖼️ Product image URL:", productImageUrl);
  console.log("📸 Selected images:", selectedImageUrls?.length || 0);
  console.log("⚙️ Configuration:", configuration);

  try {
    // Prepare the input according to Fal.ai Veo3 API schema
    const input: any = {
      prompt: videoPrompt,
      image_url: primaryImageUrl,
    };

    // Map aspect ratio - Veo3 only supports "auto", "16:9", "9:16"
    if (configuration.aspectRatio === '16:9' || configuration.aspectRatio === '9:16') {
      input.aspect_ratio = configuration.aspectRatio;
    } else {
      input.aspect_ratio = "auto"; // Default fallback
    }

    // Duration - Veo3 only supports "8s" currently
    input.duration = "8s";

    // Resolution - Veo3 supports "720p" and "1080p"
    if (configuration.resolution === '720p' || configuration.resolution === '1080p') {
      input.resolution = configuration.resolution;
    } else {
      input.resolution = "720p"; // Default fallback
    }

    // Generate audio - boolean
    input.generate_audio = configuration.generateAudio !== false; // Default to true

    console.log("🎬 Final Veo3 input parameters:", input);

    const result = await client.subscribe("fal-ai/veo3/fast/image-to-video", {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("✅ Video generated successfully");
    console.log("📊 Result:", result);

    if (result.data && result.data.video && result.data.video.url) {
      return result.data.video.url;
    } else {
      throw new Error("No video URL received from Fal.ai");
    }

  } catch (error) {
    console.error("❌ Error generating video with Veo3:", error);
    
    // Provide more specific error messages for common Fal.ai issues
    if (error instanceof Error) {
      if (error.message.includes('422') || error.message.includes('Unprocessable Entity')) {
        throw new Error(`Fal.ai validation error: Invalid parameters sent to Veo3 API. Please check image URL and prompt format.`);
      }
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error(`Fal.ai authentication error: Invalid or missing API key.`);
      }
      if (error.message.includes('429')) {
        throw new Error(`Fal.ai rate limit exceeded: Please try again later.`);
      }
      if (error.message.includes('image')) {
        throw new Error(`Fal.ai image error: Could not process the provided image. Please ensure the image URL is valid and accessible.`);
      }
    }
    
    throw error;
  }
}

function createVideoPrompt(script: VideoScript, avatar: VideoAvatar, productImageUrl: string, selectedImageUrls?: string[]): string {
  // Create a comprehensive prompt that combines the script with the avatar information and product reference
  const basePrompt = `IMPORTANT: This video MUST feature the EXACT product shown in the provided product image. Do not substitute with any other product.

The video features ${avatar.name || `a ${avatar.gender} presenter`} ${avatar.description || 'professional spokesperson'} who ${avatar.pose === 'sitting' ? 'is seated' : 'stands'} while demonstrating the SPECIFIC PRODUCT shown in the provided image in an engaging ${script.tone} manner.

AVATAR REQUIREMENTS:
- Use the EXACT avatar: ${avatar.name} (${avatar.gender})
- Avatar appearance: ${avatar.description || 'professional and trustworthy appearance'}
- Avatar pose: ${avatar.pose || 'standing naturally'}
- ${avatar.category ? `Expertise areas: ${avatar.category.join(', ')}` : ''}

PRODUCT REQUIREMENTS:
- The video MUST showcase the EXACT product from the provided product image
- Do NOT use any other product or generic items
- The product image provided is the main reference - use this specific product throughout
${selectedImageUrls && selectedImageUrls.length > 1 ? `- Multiple product angles available: Show different views and features from the ${selectedImageUrls.length} selected images` : ''}
${selectedImageUrls && selectedImageUrls.length > 1 ? `- Incorporate variety: Use different product angles and details to create dynamic video content` : ''}

VIDEO CONTENT:
- Opening: ${script.introduction}
- Product demonstrations highlighting: ${script.productHighlights.join(', ')}
- Closing with: ${script.callToAction}

THE PRESENTER (${avatar.name}) SHOULD:
- Speak naturally and enthusiastically about the SPECIFIC product shown in the image
- Use hand gestures and expressions appropriate for a ${script.tone} presentation
- Maintain eye contact with the camera
- Show genuine excitement about the product features
- Look professional and trustworthy
- Hold, point to, or interact with the ACTUAL product from the provided image

CAMERA WORK AND SCENE:
- Close-ups of the presenter speaking
- Clear shots of the SPECIFIC product from the provided image
- Product demonstrations and feature highlights
- Smooth transitions between presenter and product shots
- Professional lighting that enhances both the presenter and the ACTUAL product
- Ensure the product from the image is clearly visible and prominent

CRITICAL: The video MUST use the exact product shown in the provided image and the exact avatar (${avatar.name}) specified. Do not substitute with other products or presenters.

Duration: approximately ${script.duration} seconds of professional product demonstration.`;

  return basePrompt;
}

export async function enhanceProductImageWithNanoBanana(
  imageUrl: string,
  enhancementPrompt: string = "enhance image quality, improve lighting and colors for professional product photography"
): Promise<string> {
  const client = getFalClient();

  console.log("🎨 Enhancing product image with Nano Banana...");
  console.log("🖼️ Original image:", imageUrl);
  console.log("📝 Enhancement prompt:", enhancementPrompt);

  try {
    const result = await client.subscribe("fal-ai/nano-banana/edit", {
      input: {
        prompt: enhancementPrompt,
        image_urls: [imageUrl],
        num_images: 1,
        output_format: "jpeg",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("✅ Image enhanced successfully");

    if (result.data && result.data.images && result.data.images[0] && result.data.images[0].url) {
      return result.data.images[0].url;
    } else {
      throw new Error("No enhanced image URL received from Fal.ai");
    }

  } catch (error) {
    console.error("❌ Error enhancing image with Nano Banana:", error);
    throw error;
  }
}

export async function testFalConnection(): Promise<boolean> {
  try {
    getFalClient();
    // Since there's no simple test endpoint, we'll just check if the client initializes
    console.log("✅ Fal.ai client initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Error testing Fal.ai connection:", error);
    return false;
  }
}