"use client";

import { useState } from "react";
import { Sparkles, Link2, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputMode,
  AppStatus,
  ProductData,
  GenerateAdResponse,
} from "@/lib/types";
import UrlInput from "@/components/UrlInput";
import ProductForm from "@/components/ProductForm";
import GeneratedAd from "@/components/GeneratedAd";
import GridBeamsBackground from "@/components/ui/grid-beams-background";
import { AuroraText } from "@/components/magicui/aurora-text";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [generatedAd, setGeneratedAd] = useState<GenerateAdResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);

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
      const scrapeResponse = await fetch("/api/scrape-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const scrapeResult = await scrapeResponse.json();

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || "Error scraping product");
      }

      await handleGenerateAd(scrapeResult.data);
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
            Create professional ads with{" "}
            <span className="text-yellow-400">Agent AI</span>
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
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
                    Enter a product URL to automatically generate an ad
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
                    Manually enter product information to generate a custom ad
                  </p>
                  <ProductForm
                    onSubmit={handleGenerateAd}
                    isLoading={status === "generating"}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Generated Ad Display */}
            {generatedAd && generatedAd.success && (
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

            {status === "generating" && (
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
            <p>Powered by Amazon Bedrock• MCP Hackathon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
