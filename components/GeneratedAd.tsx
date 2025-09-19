"use client";

import { useState } from "react";
import { Download, Edit, Type, Shuffle, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GenerateAdResponse, AdPrompt } from "@/lib/types";
import LogoEditor from "./LogoEditor";
import { MorphPanel } from "@/components/ui/ai-edit-input";

interface GeneratedAdProps {
  adData: GenerateAdResponse;
  onEditImage: (prompt: string) => void;
  onRemoveText: () => void;
  onCreateVariation: () => void;
  onUpdateImage: (newImageBase64: string) => void;
  isProcessing?: boolean;
}

export default function GeneratedAd({ 
  adData, 
  onEditImage, 
  onRemoveText, 
  onCreateVariation,
  onUpdateImage,
  isProcessing = false 
}: GeneratedAdProps) {
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);

  if (!adData.success || !adData.imageBase64) {
    return null;
  }

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${adData.imageBase64}`;
    link.download = `ad-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditImage = (prompt: string) => {
    onEditImage(prompt);
  };

  const handleLogoSave = (newImageBase64: string) => {
    setIsLogoEditorOpen(false);
    onUpdateImage(newImageBase64);
  };


  return (
    <div className="space-y-6">
      {/* Generated Image */}
      <Card className="overflow-hidden bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <div className="relative">
          <img
            src={`data:image/jpeg;base64,${adData.imageBase64}`}
            alt="Generated ad"
            className="w-full h-auto"
          />
        </div>
      </Card>


      {/* Edit Panel */}
      <div className="flex justify-center">
        <MorphPanel 
          onSubmit={handleEditImage}
          isProcessing={isProcessing}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button 
          onClick={onRemoveText} 
          variant="outline" 
          className="flex items-center gap-2 rounded-full px-4 h-11 border-gray-700 hover:bg-gray-800/50"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              Processing...
            </>
          ) : (
            <>
              <Type className="h-4 w-4" />
              Remove text
            </>
          )}
        </Button>
        
        <Button 
          onClick={() => setIsLogoEditorOpen(true)} 
          variant="outline" 
          className="flex items-center gap-2 rounded-full px-4 h-11 border-gray-700 hover:bg-gray-800/50"
        >
          <ImagePlus className="h-4 w-4" />
          Insert logo
        </Button>
        
        <Button 
          onClick={onCreateVariation} 
          variant="outline" 
          className="flex items-center gap-2 rounded-full px-4 h-11 border-gray-700 hover:bg-gray-800/50"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              Creating...
            </>
          ) : (
            <>
              <Shuffle className="h-4 w-4" />
              Create variation
            </>
          )}
        </Button>
        
        <Button 
          onClick={downloadImage} 
          variant="outline" 
          className="flex items-center gap-2 rounded-full px-4 h-11 border-gray-700 hover:bg-gray-800/50"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Tips */}
      <Card className="p-3 bg-gray-800/10 border-gray-700/30">
        <h4 className="text-xs font-medium text-gray-500 mb-1">Tips for better results:</h4>
        <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
          <li>Use &quot;Edit image&quot; to modify with specific instructions</li>
          <li>&quot;Remove text&quot; automatically removes all text from the ad</li>
          <li>&quot;Insert logo&quot; allows you to add your brand to the design</li>
          <li>&quot;Create variation&quot; generates a different version of the same product</li>
        </ul>
      </Card>
      
      {/* Modals */}
      <LogoEditor
        imageBase64={adData.imageBase64}
        isOpen={isLogoEditorOpen}
        onClose={() => setIsLogoEditorOpen(false)}
        onSave={handleLogoSave}
      />
    </div>
  );
}