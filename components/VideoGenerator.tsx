"use client";

import { useState } from "react";
import { Video, User, Settings, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-borders-button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AvatarSelector from "./AvatarSelector";
import VideoPreview from "./VideoPreview";
import ProductReview from "./ProductReview";
import type {
  ProductData,
  VideoAvatar,
  VideoConfiguration,
  VideoScript,
  VideoGenerationResponse,
  VideoScriptGenerationResponse,
  AmazonProduct
} from "@/lib/types";

interface VideoGeneratorProps {
  productData: ProductData;
  rawProductData?: AmazonProduct; // Optional raw Amazon product data for images
}

interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  selected: boolean;
  clipCount?: number;
}

export default function VideoGenerator({ productData, rawProductData }: VideoGeneratorProps) {
  console.log("🎬 VideoGenerator initialized with productData:", productData);

  // State management
  const [currentStep, setCurrentStep] = useState<'review' | 'generating' | 'preview'>('review');
  const [selectedAvatar, setSelectedAvatar] = useState<VideoAvatar | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [videoConfiguration, setVideoConfiguration] = useState({
    language: 'English',
    aspectRatio: '9:16',
    videoLength: 'Auto',
    objective: 'Traffic'
  });
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [configuration, setConfiguration] = useState<VideoConfiguration>({
    aspectRatio: '16:9',
    duration: '8s',
    actualDuration: '8s',
    resolution: '720p',
    generateAudio: true
  });
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<VideoGenerationResponse | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Video generation progress steps
  const [generationStep, setGenerationStep] = useState(0);
  const steps = [
    "Analyze Product Materials",
    "Create AI-Powered Ad Scripts",
    "Select Video Templates",
    "Choose Video Avatars",
    "Synthesize Avatar Voices",
    "Curate Video Assets",
    "Generate Preview Videos"
  ];

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    setError(null);

    // Validate productData before sending
    console.log("🔍 Validating productData:", productData);

    if (!productData.title || !productData.description || !productData.price) {
      setError("Missing required product information (title, description, or price)");
      setIsGeneratingScript(false);
      return;
    }

    const requestPayload = {
      productData,
      tone: 'energetic' as const,
      duration: 15,
      focusPoints: productData.features || []
    };

    console.log("📤 Sending video script request:", requestPayload);

    try {
      const response = await fetch("/api/generate-video-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      console.log("📥 Response status:", response.status);

      const result: VideoScriptGenerationResponse = await response.json();
      console.log("📥 Response data:", result);

      if (result.success && result.script) {
        setVideoScript(result.script);
        console.log("✅ Video script set successfully");
      } else {
        const errorMessage = result.error || "Failed to generate script";
        console.error("❌ Script generation failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("❌ Error generating script:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedAvatar || !videoScript) {
      setError("Please select an avatar and generate a script first");
      return;
    }

    setIsGeneratingVideo(true);
    setError(null);
    setGenerationStep(0);

    // Simulate progress through steps
    const progressInterval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productData,
          avatar: selectedAvatar,
          configuration,
          script: videoScript
        }),
      });

      const result: VideoGenerationResponse = await response.json();

      clearInterval(progressInterval);

      if (result.success && result.videoUrl) {
        setGeneratedVideo(result);
        setGenerationStep(steps.length - 1);
        setCurrentStep('preview');
      } else {
        throw new Error(result.error || "Failed to generate video");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating video:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleConfigurationChange = (key: keyof VideoConfiguration, value: string | boolean) => {
    setConfiguration(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Direct script generation without relying on state updates
  const generateVideoScriptDirectly = async (productData: ProductData) => {
    const requestPayload = {
      productData: {
        ...productData,
        imageUrl: productData.imageUrl, // Ensure image URL is passed for script context
      },
      tone: 'energetic' as const,
      duration: 15,
      focusPoints: productData.features || []
    };

    console.log("📤 Sending video script request:", requestPayload);

    const response = await fetch("/api/generate-video-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("📥 Script response status:", response.status);

    const result = await response.json();
    console.log("📥 Script response data:", result);

    if (result.success && result.script) {
      return result.script;
    } else {
      throw new Error(result.error || "Failed to generate script");
    }
  };

  // Video generation with script
  const handleGenerateVideoWithScript = async (
    script: VideoScript,
    avatar: VideoAvatar,
    config: VideoConfiguration,
    selectedAssets: { id: string; url: string; type: 'image' | 'video'; selected: boolean }[]
  ) => {
    setIsGeneratingVideo(true);
    setGenerationStep(3); // Choose Video Avatars

    // Simulate progress through remaining steps
    const progressInterval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    try {
      const imageUrls = selectedAssets
        .filter(asset => asset.type === 'image')
        .map(asset => asset.url);

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productData,
          avatar,
          configuration: config,
          script,
          selectedImageUrls: imageUrls
        }),
      });

      const result = await response.json();
      clearInterval(progressInterval);

      if (result.success && result.videoUrl) {
        setGeneratedVideo(result);
        setGenerationStep(steps.length - 1);
        setCurrentStep('preview');
      } else {
        throw new Error(result.error || "Failed to generate video");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating video:", error);
      throw error;
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleProductReviewGenerate = async (config: {
    productData: ProductData;
    selectedAssets: MediaAsset[];
    selectedAvatar: VideoAvatar | null;
    configuration: {
      language: string;
      aspectRatio: string;
      videoLength: string;
      objective: string;
    };
  }) => {
    console.log("🎬 Starting video generation from product review:", config);

    if (!config.selectedAvatar) {
      setError("Please select an avatar before generating the video");
      return;
    }

    // Update state with selected configuration
    setSelectedAssets(config.selectedAssets);
    setSelectedAvatar(config.selectedAvatar);
    setVideoConfiguration(config.configuration);
    setCurrentStep('generating');
    setGenerationStep(0);
    setError(null);

    // Map user configuration to VideoConfiguration
    const aspectRatioMap: { [key: string]: '16:9' | '9:16' | 'auto' } = {
      '16:9': '16:9',
      '9:16': '9:16',
      '1:1': '16:9', // fallback
    };

    const durationMap: { [key: string]: '8s' | '15s' | '30s' | '60s' | 'Auto' } = {
      'Auto': 'Auto',
      '15s': '15s',
      '30s': '30s',
      '60s': '60s',
    };

    const updatedConfiguration: VideoConfiguration = {
      ...configuration,
      aspectRatio: aspectRatioMap[config.configuration.aspectRatio] || '16:9',
      duration: durationMap[config.configuration.videoLength] || '8s', // For script timing
      actualDuration: '8s', // Fal.ai only supports 8s videos
      resolution: '720p', // Ensure we have a valid resolution
      generateAudio: true,
    };

    try {
      console.log("🎬 Step 1: Generating video script...");
      setGenerationStep(0); // Analyze Product Materials

      // First generate the script
      const scriptResult = await generateVideoScriptDirectly(productData);
      console.log("✅ Script generated successfully:", scriptResult);

      setVideoScript(scriptResult);
      setGenerationStep(1); // Create AI-Powered Ad Scripts

      if (scriptResult && config.selectedAvatar) {
        console.log("🎬 Step 2: Generating video with script...");
        setGenerationStep(2); // Select Video Templates

        await handleGenerateVideoWithScript(scriptResult, config.selectedAvatar, updatedConfiguration, config.selectedAssets);
      } else {
        throw new Error("Failed to generate script or missing avatar");
      }
    } catch (error) {
      console.error("Error in product review generation:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setCurrentStep('review');
      setGenerationStep(0);
    }
  };

  // Render based on current step
  if (currentStep === 'preview' && generatedVideo && generatedVideo.success && generatedVideo.videoUrl) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Video Generated Successfully! 🎉</h3>
          <p className="text-gray-400">Your professional product video is ready</p>
        </div>

        <VideoPreview
          videoUrl={generatedVideo.videoUrl}
          script={generatedVideo.script}
          title={productData.title}
          onGenerateMore={() => {
            setGeneratedVideo(null);
            setGenerationStep(0);
            setCurrentStep('review');
          }}
          isProcessing={isGeneratingVideo}
        />
      </div>
    );
  }

  // If generating video, show progress
  if (currentStep === 'generating') {
    return (
      <Card className="p-8 bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-white">Generating Video...{Math.round(((generationStep + 1) / steps.length) * 100)}%</h3>
          <p className="text-gray-400">Please wait for generate, This may take up to 45 seconds.</p>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setCurrentStep('review');
                  setGenerationStep(0);
                }}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    error && index === generationStep ? 'bg-red-500' :
                    index < generationStep ? 'bg-green-500' :
                    index === generationStep ? 'bg-blue-500' : 'bg-gray-600'
                  }`}>
                    {error && index === generationStep ? '✗' :
                     index < generationStep ? '✓' :
                     index === generationStep ? <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div> : '•'}
                  </div>
                  <span className={`${
                    error && index === generationStep ? 'text-red-400' :
                    index <= generationStep ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step}
                    {error && index === generationStep && <span className="text-red-400 ml-2">(Failed)</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Success message for completed steps */}
          {!error && generationStep > 0 && (
            <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400 text-sm">
                {generationStep === 1 && "✅ Video script generated successfully"}
                {generationStep === 2 && "✅ Video templates selected"}
                {generationStep === 3 && "✅ Avatar configured"}
                {generationStep >= 4 && "✅ Processing video..."}
              </p>
            </div>
          )}

          {/* Animated preview similar to your design */}
          {!error && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl">
              <div className="text-white text-center">
                <h4 className="text-lg font-bold mb-2">Generate the Perfect Video Ad Asset in One Click</h4>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    ✓ All you need is a link to your product
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm mt-2">
                  <span className="flex items-center gap-1">
                    ✓ Trusted by 100,000+ Brands & Advertisers
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm mt-2">
                  <span className="flex items-center gap-1">
                    ✓ Diverse templates & effects
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default: Show product review step
  return (
    <ProductReview
      productData={productData}
      rawProductData={rawProductData}
      onGenerate={handleProductReviewGenerate}
      isGenerating={isGeneratingVideo}
    />
  );
}