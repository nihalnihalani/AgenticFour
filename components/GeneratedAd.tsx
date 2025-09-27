"use client";

import { useState } from "react";
import { Download, Type, Shuffle, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GenerateAdResponse } from "@/lib/types";
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

  if (!adData.success) {
    return null;
  }

  const downloadSpecifications = () => {
    const specifications = {
      timestamp: new Date().toISOString(),
      advertisementStrategy: adData.prompt,
      productImageUrl: adData.imageBase64 ? 'Generated placeholder' : 'Not available'
    };
    
    const blob = new Blob([JSON.stringify(specifications, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `advertisement-strategy-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      {/* Generated Advertisement Image */}
      <Card className="overflow-hidden bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <div className="relative">
          {adData.imageBase64 ? (
            <img
              src={adData.imageBase64}
              alt="Generated advertisement"
              className="w-full h-auto"
            />
          ) : (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-2">Advertisement Strategy Generated</h3>
              <p className="text-gray-400">Image generation is being processed...</p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Advertisement Details */}
      {adData.prompt && (
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📋 Advertisement Strategy Details
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Primary Focus</h4>
                <p className="text-gray-300">{adData.prompt.style_parameters?.visual_hierarchy?.primary_focus || adData.prompt.primary_focus || 'Product highlight'}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-400 mb-2">Color Scheme</h4>
                  <p className="text-gray-300">{adData.prompt.color_psychology?.primary_colors || 'Brand colors'}</p>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-400 mb-2">Typography</h4>
                  <p className="text-gray-300">{adData.prompt.typography_strategy?.font_personality || 'Modern, clean fonts'}</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-400 mb-2">Call to Action</h4>
                <p className="text-gray-300">{adData.prompt.style_parameters?.call_to_action?.clarity || adData.prompt.call_to_action?.urgency || 'Shop now'}</p>
              </div>
              
              <div className="bg-green-900/20 border border-green-800 p-4 rounded-lg">
                <p className="text-green-400 text-sm">
                  <strong>✅ Success:</strong> Advertisement image generated using AI! 
                  The image above shows your custom advertisement design.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}


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
          onClick={downloadSpecifications} 
          variant="outline" 
          className="flex items-center gap-2 rounded-full px-4 h-11 border-gray-700 hover:bg-gray-800/50"
        >
          <Download className="h-4 w-4" />
          Download Strategy
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