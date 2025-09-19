"use client";

import { useState } from "react";
import { Link2, FileEdit, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputMode,
  AppStatus,
  ProductData,
  GenerateAdResponse,
  AmazonProduct,
} from "@/lib/types";
import { ProductService } from "@/lib/product-service";
import UrlInput from "@/components/UrlInput";
import ProductForm from "@/components/ProductForm";
import GeneratedAd from "@/components/GeneratedAd";
import VideoGenerator from "@/components/VideoGenerator";
import GridBeamsBackground from "@/components/ui/grid-beams-background";
import { AuroraText } from "@/components/magicui/aurora-text";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [contentMode, setContentMode] = useState<'image' | 'video'>('image');
  const [status, setStatus] = useState<AppStatus>("idle");
  const [generatedAd, setGeneratedAd] = useState<GenerateAdResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [rawProductData, setRawProductData] = useState<AmazonProduct | null>(null);

  const handleGenerateAd = async (data: ProductData) => {
    // Reset previous ad before generating new one
    setGeneratedAd(null);
    setStatus("generating");
    setError(null);
    setProductData(data);

    try {
      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productData: data,
        }),
      });

      const result: GenerateAdResponse = await response.json();

      if (result.success) {
        setGeneratedAd(result);
        setStatus("success");
        // Reset to idle after showing success
        setTimeout(() => {
          setStatus("idle");
        }, 100);
      } else {
        throw new Error(result.error || "Error generating ad");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  const handleScrapeAndGenerate = async (url: string) => {
    // Reset previous state
    setGeneratedAd(null);
    setStatus("scraping");
    setError(null);

    try {
      // Check if URL is supported
      if (!ProductService.isSupportedUrl(url)) {
        throw new Error("URL not supported. Please use a valid Amazon product URL.");
      }

      // Normalize the URL
      const normalizedUrl = ProductService.normalizeUrl(url);

      // Use ProductService with caching
      const scrapeResult = await ProductService.fetchProductData(normalizedUrl, {
        enableCache: true,
        forceRefresh: false
      });

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || "Error scraping product");
      }

      setProductData(scrapeResult.data);

      // Store raw Amazon product data if available
      if (scrapeResult.rawData) {
        setRawProductData(scrapeResult.rawData);
      }

      if (contentMode === 'image') {
        await handleGenerateAd(scrapeResult.data);
      } else {
        setStatus("idle"); // For video, the VideoGenerator will handle the generation
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  const handleEditImage = async (prompt: string) => {
    if (!generatedAd?.imageBase64) return;

    setStatus("generating");
    setError(null);

    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: generatedAd.imageBase64,
          prompt,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedAd({
          ...generatedAd,
          imageBase64: result.imageBase64,
        });
        setStatus("success");
      } else {
        throw new Error(result.error || "Error editing image");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  const handleRemoveText = async () => {
    if (!generatedAd?.imageBase64) return;

    setStatus("generating");
    setError(null);

    try {
      const response = await fetch("/api/remove-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: generatedAd.imageBase64,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedAd({
          ...generatedAd,
          imageBase64: result.imageBase64,
        });
        setStatus("success");
      } else {
        throw new Error(result.error || "Error removing text");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  const handleCreateVariation = async () => {
    if (!generatedAd?.prompt || !productData) return;

    setStatus("generating");
    setError(null);

    try {
      const response = await fetch("/api/create-variation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalPrompt: generatedAd.prompt,
          productData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedAd({
          success: true,
          imageBase64: result.imageBase64,
          prompt: result.prompt,
        });
        setStatus("success");
        // Reset to idle after showing success
        setTimeout(() => {
          setStatus("idle");
        }, 100);
      } else {
        throw new Error(result.error || "Error creating variation");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  const handleUpdateImage = (newImageBase64: string) => {
    if (!generatedAd) return;

    setGeneratedAd({
      ...generatedAd,
      imageBase64: newImageBase64,
    });
  };

  return (
    <div className="min-h-screen relative">
      <GridBeamsBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
              <AuroraText
                colors={["#ffffff", "#f3f4f6", "#e5e7eb", "#d1d5db"]}
                speed={1.2}
              >
                OneClick
              </AuroraText>
            </h1>
          </div>
          <p className="text-gray-200 text-lg font-medium">
            Create professional {contentMode === 'image' ? 'images' : 'videos'} with{" "}
            <span className="text-yellow-400">Agent AI</span>
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Content Type Selector */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800/50 p-1 rounded-lg flex">
              <button
                onClick={() => {setContentMode('image'); setGeneratedAd(null);}}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  contentMode === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Generate Images
              </button>
              <button
                onClick={() => {setContentMode('video'); setGeneratedAd(null);}}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  contentMode === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Video className="h-4 w-4" />
                Generate Videos
              </button>
            </div>
          </div>

          <Card className="p-6 bg-gray-900/80 backdrop-blur-sm border-gray-700">
            <Tabs
              value={inputMode}
              onValueChange={(v) => setInputMode(v as InputMode)}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Product URL
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url">
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Enter a product URL to automatically generate {contentMode === 'image' ? 'an ad' : 'a video'}
                  </p>
                  <UrlInput
                    onSubmit={handleScrapeAndGenerate}
                    isLoading={status === "scraping" || status === "generating"}
                  />
                </div>
              </TabsContent>

              <TabsContent value="manual">
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Manually enter product information to generate {contentMode === 'image' ? 'a custom ad' : 'a custom video'}
                  </p>
                  {contentMode === 'image' ? (
                    <ProductForm
                      onSubmit={handleGenerateAd}
                      isLoading={status === "generating"}
                    />
                  ) : (
                    <ProductForm
                      onSubmit={(data) => {
                        setProductData(data);
                        setStatus("idle");
                      }}
                      isLoading={false}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Generated Content Display */}
            {contentMode === 'image' && generatedAd && generatedAd.success && (
              <div className="mt-6">
                <GeneratedAd
                  adData={generatedAd}
                  onEditImage={handleEditImage}
                  onRemoveText={handleRemoveText}
                  onCreateVariation={handleCreateVariation}
                  onUpdateImage={handleUpdateImage}
                  isProcessing={status === "generating"}
                />
              </div>
            )}

            {/* Video Generator Display */}
            {contentMode === 'video' && productData && (
              <div className="mt-6">
                <VideoGenerator
                  productData={productData}
                  rawProductData={rawProductData || undefined}
                />
              </div>
            )}

            {/* Loading State */}
            {status === "scraping" && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  <p className="text-gray-400">
                    Extracting product information...
                  </p>
                </div>
              </div>
            )}

            {status === "generating" && contentMode === 'image' && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  <p className="text-gray-400">Processing with AI...</p>
                </div>
              </div>
            )}
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>Powered by Amazon Bedrock & Fal.ai • MCP Hackathon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
