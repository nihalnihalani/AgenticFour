"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Check } from "lucide-react";

interface LogoEditorProps {
  imageBase64: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newImageBase64: string) => void;
}

export default function LogoEditor({ imageBase64, isOpen, onClose, onSave }: LogoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasLogo, setHasLogo] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // First, load the image to get its dimensions
    const tempImg = new Image();
    tempImg.onload = () => {
      // Calculate canvas size to maintain aspect ratio
      const maxWidth = Math.min(800, window.innerWidth * 0.7);
      const maxHeight = Math.min(600, window.innerHeight * 0.6);
      let width = tempImg.width;
      let height = tempImg.height;
      
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      
      setCanvasSize({ width, height });
      
      // Initialize fabric canvas with correct size
      if (!canvasRef.current) return;
      
      const canvas = new Canvas(canvasRef.current, {
        width: width,
        height: height,
        preserveObjectStacking: true,
        imageSmoothingEnabled: true,
        renderOnAddRemove: false, // Better performance
      });
      
      // Set device pixel ratio for better quality
      const scale = window.devicePixelRatio;
      canvas.setWidth(width * scale);
      canvas.setHeight(height * scale);
      canvas.setZoom(scale);
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      
      fabricCanvasRef.current = canvas;

      // Load background image
      FabricImage.fromURL(`data:image/jpeg;base64,${imageBase64}`).then((img) => {
        // Set image to exact canvas size (accounting for device pixel ratio)
        const imgScale = Math.min(width / img.width!, height / img.height!);
        img.scaleX = imgScale * scale;
        img.scaleY = imgScale * scale;
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });
        
        canvas.backgroundImage = img;
        canvas.renderAll();
      });
    };
    tempImg.src = `data:image/jpeg;base64,${imageBase64}`;

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [isOpen, imageBase64]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      FabricImage.fromURL(event.target?.result as string).then((img) => {
        // Scale logo to reasonable size
        const maxSize = 150;
        const scale = maxSize / Math.max(img.width!, img.height!);
        img.scaleX = scale;
        img.scaleY = scale;
        
        // Center the logo (accounting for device pixel ratio)
        const canvasScale = window.devicePixelRatio;
        img.set({
          left: (canvasSize.width * canvasScale - img.getScaledWidth()) / 2,
          top: (canvasSize.height * canvasScale - img.getScaledHeight()) / 2,
        });
        
        // Remove previous logos
        const objects = fabricCanvasRef.current!.getObjects();
        objects.forEach(obj => fabricCanvasRef.current!.remove(obj));
        
        fabricCanvasRef.current!.add(img);
        fabricCanvasRef.current!.setActiveObject(img);
        fabricCanvasRef.current!.renderAll();
        setHasLogo(true);
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!fabricCanvasRef.current) return;
    
    // Reset zoom to 1 for export to get the full resolution
    const currentZoom = fabricCanvasRef.current.getZoom();
    fabricCanvasRef.current.setZoom(1);
    
    // Use PNG for lossless quality when logo is added
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });
    
    // Restore zoom
    fabricCanvasRef.current.setZoom(currentZoom);
    
    // Convert data URL to base64
    const base64 = dataURL.split(',')[1];
    onSave(base64);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card 
        className="w-auto max-w-[90vw] max-h-[90vh] p-6 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Insert logo</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center border rounded-lg overflow-hidden bg-gray-900">
            <div style={{ width: canvasSize.width, height: canvasSize.height }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload logo
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasLogo}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Upload a logo and drag it to position. Use the corners to resize.
          </p>
        </div>
      </Card>
    </div>
  );
}