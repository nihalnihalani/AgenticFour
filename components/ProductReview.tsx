"use client";

import { useState } from "react";
import { Plus, Check, Play, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AvatarSelector from "./AvatarSelector";
import type { ProductData, VideoAvatar, AmazonProduct } from "@/lib/types";

interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  selected: boolean;
  clipCount?: number;
}

interface ProductReviewProps {
  productData: ProductData;
  rawProductData?: AmazonProduct; // Optional raw Amazon product data for images
  onGenerate: (config: {
    productData: ProductData;
    selectedAssets: MediaAsset[];
    selectedAvatar: VideoAvatar | null;
    configuration: {
      language: string;
      aspectRatio: string;
      videoLength: string;
      objective: string;
    };
  }) => void;
  isGenerating?: boolean;
}

export default function ProductReview({ productData, rawProductData, onGenerate, isGenerating = false }: ProductReviewProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<VideoAvatar | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [configuration, setConfiguration] = useState({
    language: 'English',
    aspectRatio: '9:16',
    videoLength: 'Auto',
    objective: 'Traffic'
  });

  // Generate media assets from real product data
  const generateMediaAssets = (): MediaAsset[] => {
    const assets: MediaAsset[] = [];

    // Add main product image first
    if (productData.imageUrl) {
      assets.push({
        id: 'main',
        url: productData.imageUrl,
        type: 'image',
        selected: true
      });
    }

    // Add high-resolution images from raw product data
    if (rawProductData?.highResolutionImages) {
      rawProductData.highResolutionImages.forEach((imageUrl, index) => {
        // Skip if it's the same as main image
        if (imageUrl !== productData.imageUrl) {
          assets.push({
            id: `high-res-${index}`,
            url: imageUrl,
            type: 'image',
            selected: index < 8, // Select first 8 by default
            clipCount: Math.floor(Math.random() * 5) + 1 // Random clip count for variety
          });
        }
      });
    }

    // Add gallery thumbnails if available
    if (rawProductData?.galleryThumbnails) {
      rawProductData.galleryThumbnails.forEach((imageUrl, index) => {
        // Skip duplicates
        if (!assets.find(asset => asset.url === imageUrl)) {
          assets.push({
            id: `gallery-${index}`,
            url: imageUrl,
            type: 'image',
            selected: false, // Don't select thumbnails by default
            clipCount: Math.floor(Math.random() * 3) + 1
          });
        }
      });
    }

    // Fallback to mock data if no real images are available
    if (assets.length === 0) {
      return [
        { id: '1', url: productData.imageUrl || '', type: 'image', selected: true },
        { id: '2', url: '/api/placeholder/product-angle2.jpg', type: 'image', selected: true, clipCount: 3 },
        { id: '3', url: '/api/placeholder/product-angle3.jpg', type: 'image', selected: false, clipCount: 1 }
      ];
    }

    return assets;
  };

  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(generateMediaAssets());

  const toggleAssetSelection = (assetId: string) => {
    setMediaAssets(prev => prev.map(asset =>
      asset.id === assetId ? { ...asset, selected: !asset.selected } : asset
    ));
  };

  const selectAll = () => {
    setMediaAssets(prev => prev.map(asset => ({ ...asset, selected: true })));
  };

  const unselectAll = () => {
    setMediaAssets(prev => prev.map(asset => ({ ...asset, selected: false })));
  };

  const deleteSelected = () => {
    setMediaAssets(prev => prev.filter(asset => !asset.selected));
  };

  const handleGenerate = () => {
    const selectedAssets = mediaAssets.filter(asset => asset.selected);
    onGenerate({
      productData,
      selectedAssets,
      selectedAvatar,
      configuration
    });
  };

  const selectedCount = mediaAssets.filter(asset => asset.selected).length;

  return (
    <div className="space-y-6">
      {/* Product Details */}
      <Card className="p-6 bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Product Details</h2>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-400 text-sm">Product Name *</Label>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg mt-1">
              <span className="text-white text-sm">{productData.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Logo
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-sm">Product Description *</Label>
            <div className="p-3 bg-gray-800/50 rounded-lg mt-1">
              <p className="text-white text-sm leading-relaxed">{productData.description || 'No description available'}</p>
              <div className="text-right text-gray-500 text-xs mt-2">
                {(productData.description || '').length} / 3000
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Media Selection */}
      <Card className="p-6 bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Media*</h3>
            <p className="text-gray-400 text-sm">Confirm to use higher-quality assets. Waiting for the analysis brings better video quality.</p>
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          {/* Add Media Button */}
          <div className="aspect-square bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700/50 transition-colors">
            <Plus className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-gray-400 text-xs text-center">Add media<br />at least 1</span>
          </div>

          {/* Media Assets */}
          {mediaAssets.map((asset) => (
            <div key={asset.id} className="relative aspect-square">
              <div
                className={`relative w-full h-full bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  asset.selected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-500'
                }`}
                onClick={() => toggleAssetSelection(asset.id)}
              >
                {/* Asset image */}
                {asset.type === 'image' ? (
                  <img
                    src={asset.url}
                    alt={`Product asset ${asset.id}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <Play className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                {/* Fallback placeholder (hidden by default) */}
                <div className="hidden w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center absolute inset-0">
                  <div className="text-gray-400 text-xs text-center">IMG<br />{asset.id}</div>
                </div>

                {/* Selection Checkbox */}
                <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 border-white flex items-center justify-center ${
                  asset.selected ? 'bg-blue-500' : 'bg-transparent'
                }`}>
                  {asset.selected && <Check className="h-3 w-3 text-white" />}
                </div>

                {/* Clip Count */}
                {asset.clipCount && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {asset.clipCount} clips
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Media Controls */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={selectAll}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={unselectAll}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Unselect All
          </button>
          <button
            onClick={deleteSelected}
            className="text-red-400 hover:text-red-300 transition-colors"
            disabled={selectedCount === 0}
          >
            Delete Select
          </button>
          <span className="text-gray-400 ml-auto">
            {selectedCount} of {mediaAssets.length} selected
          </span>
        </div>
      </Card>

      {/* Hooks & Avatars */}
      <Card className="p-6 bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Hooks & Avatars</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Hooks */}
          <div className="bg-purple-600/10 border border-purple-600/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-purple-400 rounded-full border-dashed"></div>
              </div>
              <span className="text-white font-medium">Hooks</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">None</span>
              <span className="text-purple-400 text-sm cursor-pointer hover:text-purple-300">&gt;</span>
            </div>
          </div>

          {/* Avatar */}
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <User2 className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-white font-medium">Avatar</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={selectedAvatar ? "text-white text-sm" : "text-blue-400 text-sm"}>
                {selectedAvatar ? selectedAvatar.name : "Smart Match"}
              </span>
              <button
                onClick={() => setShowAvatarSelector(true)}
                className="text-blue-400 text-sm cursor-pointer hover:text-blue-300"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label className="text-gray-400 text-sm mb-2 block">Language</Label>
          <select
            value={configuration.language}
            onChange={(e) => setConfiguration(prev => ({ ...prev, language: e.target.value }))}
            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="English">🌍 English</option>
            <option value="Spanish">🌍 Spanish</option>
            <option value="French">🌍 French</option>
          </select>
        </div>

        <div>
          <Label className="text-gray-400 text-sm mb-2 block">Aspect Ratio</Label>
          <select
            value={configuration.aspectRatio}
            onChange={(e) => setConfiguration(prev => ({ ...prev, aspectRatio: e.target.value }))}
            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="9:16">📱 9:16</option>
            <option value="16:9">📺 16:9</option>
            <option value="1:1">⬜ 1:1</option>
          </select>
        </div>

        <div>
          <Label className="text-gray-400 text-sm mb-2 block">Video length</Label>
          <select
            value={configuration.videoLength}
            onChange={(e) => setConfiguration(prev => ({ ...prev, videoLength: e.target.value }))}
            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="Auto">⏱ Auto</option>
            <option value="15s">⏱ 15 seconds</option>
            <option value="30s">⏱ 30 seconds</option>
            <option value="60s">⏱ 60 seconds</option>
          </select>
        </div>

        <div>
          <Label className="text-gray-400 text-sm mb-2 block">Objective</Label>
          <select
            value={configuration.objective}
            onChange={(e) => setConfiguration(prev => ({ ...prev, objective: e.target.value }))}
            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="Traffic">🎯 Traffic</option>
            <option value="Conversions">💰 Conversions</option>
            <option value="Brand Awareness">📈 Brand Awareness</option>
            <option value="Engagement">❤️ Engagement</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={selectedCount === 0 || isGenerating}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              Generate <span className="ml-1">&rarr;</span>
            </>
          )}
        </Button>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          onSelect={(avatar) => {
            setSelectedAvatar(avatar);
            setShowAvatarSelector(false);
          }}
          onClose={() => setShowAvatarSelector(false)}
          selectedAvatar={selectedAvatar}
        />
      )}
    </div>
  );
}