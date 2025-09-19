"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoAvatar } from "@/lib/types";

interface AvatarSelectorProps {
  onSelect: (avatar: VideoAvatar) => void;
  onClose: () => void;
  selectedAvatar?: VideoAvatar | null;
}

// Avatar categories for filtering
const AVATAR_CATEGORIES = [
  { id: 'favorites', name: 'My Favorites', active: true },
  { id: 'male', name: 'Male' },
  { id: 'female', name: 'Female' },
  { id: 'supplement', name: 'Supplement' },
  { id: 'finance', name: 'Finance' },
  { id: 'education', name: 'Education' },
  { id: 'game', name: 'Game' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'pet', name: 'Pet' },
  { id: 'electronic', name: 'Electronic Devices' },
  { id: 'beauty', name: 'Beauty' }
];

// Avatar dataset using local images from /public/avatars directory
const GLOBAL_AVATAR_URL = 'https://cdn1.vidau.ai/upload/p2v_avatar/14/14f981073202c289dafe219cd9aa1de7.jpg';
const ORIGINAL_AVAILABLE_AVATARS: VideoAvatar[] = [
  {
    id: "smart-match",
    name: "Smart Match",
    imageUrl: "/avatars/0342501948546b3f1d5621c6dacc0f8c.jpg",
    videoImageUrl: "/avatars/0342501948546b3f1d5621c6dacc0f8c.jpg",
    gender: "female",
    description: "AI-powered avatar selection for optimal engagement",
    category: ['favorites'],
    pose: 'sitting',
    isFavorite: true
  },
  {
    id: "elena-sitting1",
    name: "Elena",
    imageUrl: "/avatars/0438a3e5fe833fa93045f50d8d3f2a0d.jpg",
    videoImageUrl: "/avatars/0438a3e5fe833fa93045f50d8d3f2a0d.jpg",
    gender: "female",
    description: "Professional and approachable female presenter",
    category: ['female', 'education', 'finance'],
    pose: 'sitting',
    isFavorite: true
  },
  {
    id: "evelyn-sitting",
    name: "Evelyn",
    imageUrl: "/avatars/0b68f1682bf5121d3503bd10766859ee.jpg",
    videoImageUrl: "/avatars/0b68f1682bf5121d3503bd10766859ee.jpg",
    gender: "female",
    description: "Energetic and friendly female spokesperson",
    category: ['female', 'beauty', 'clothing'],
    pose: 'sitting'
  },
  {
    id: "david",
    name: "David",
    imageUrl: "/avatars/0b799a6c6d71a38a926914b6d9288568.jpg",
    videoImageUrl: "/avatars/0b799a6c6d71a38a926914b6d9288568.jpg",
    gender: "male",
    description: "Professional male presenter with dynamic style",
    category: ['male', 'finance', 'electronic'],
    pose: 'standing',
    isPremium: true
  },
  {
    id: "isabella-sitting",
    name: "Isabella",
    imageUrl: "/avatars/0eadaa42709abcf476377a2e3d0ed3b1.jpg",
    videoImageUrl: "/avatars/0eadaa42709abcf476377a2e3d0ed3b1.jpg",
    gender: "female",
    description: "Elegant and sophisticated female presenter",
    category: ['female', 'beauty', 'clothing'],
    pose: 'sitting',
    isFavorite: true
  },
  {
    id: "theodore",
    name: "Theodore",
    imageUrl: "/avatars/0edb5421c222265b65128c120be22d2e.jpg",
    videoImageUrl: "/avatars/0edb5421c222265b65128c120be22d2e.jpg",
    gender: "male",
    description: "Distinguished male presenter with authority",
    category: ['male', 'finance', 'education'],
    pose: 'standing',
    isPremium: true
  },
  {
    id: "luna",
    name: "Luna",
    imageUrl: "/avatars/2c23d47a6d3984767d3d4689408916dc.jpg",
    videoImageUrl: "/avatars/2c23d47a6d3984767d3d4689408916dc.jpg",
    gender: "female",
    description: "Young and vibrant female spokesperson",
    category: ['female', 'game', 'beauty'],
    pose: 'sitting'
  },
  {
    id: "ryan-setting",
    name: "Ryan",
    imageUrl: "/avatars/4a3403c2786aa4e89c6a0beb6ee235d5.png",
    videoImageUrl: "/avatars/4a3403c2786aa4e89c6a0beb6ee235d5.png",
    gender: "male",
    description: "Casual and relatable male presenter",
    category: ['male', 'game', 'clothing'],
    pose: 'sitting',
    isPremium: true
  },
  {
    id: "luna-standing",
    name: "Luna (Standing)",
    imageUrl: "/avatars/4ae911933b1dda0bd3e11a5ecafebbb7.jpg",
    videoImageUrl: "/avatars/4ae911933b1dda0bd3e11a5ecafebbb7.jpg",
    gender: "female",
    description: "Professional standing presentation style",
    category: ['female', 'education', 'finance'],
    pose: 'standing'
  },
  {
    id: "evelyn-sitting2",
    name: "Evelyn (Alt)",
    imageUrl: "/avatars/4fb754a0adc28e2a74530886bb0903a3.jpg",
    videoImageUrl: "/avatars/4fb754a0adc28e2a74530886bb0903a3.jpg",
    gender: "female",
    description: "Comfortable sitting presentation format",
    category: ['female', 'beauty', 'supplement'],
    pose: 'sitting'
  },
  {
    id: "camila-sitting",
    name: "Camila",
    imageUrl: "/avatars/5b839b8c28cd13034abcc10a1f528181.jpg",
    videoImageUrl: "/avatars/5b839b8c28cd13034abcc10a1f528181.jpg",
    gender: "female",
    description: "Warm and engaging female presenter",
    category: ['female', 'beauty', 'clothing'],
    pose: 'sitting'
  },
  {
    id: "daphne-standing",
    name: "Daphne",
    imageUrl: "/avatars/5bf87af48c4959455efe00f6ec40ab12.jpg",
    videoImageUrl: "/avatars/5bf87af48c4959455efe00f6ec40ab12.jpg",
    gender: "female",
    description: "Professional and confident female spokesperson",
    category: ['female', 'finance', 'education'],
    pose: 'standing',
    isPremium: true
  },
  {
    id: "zoe-standing",
    name: "Zoe",
    imageUrl: "/avatars/6aac1c198a9c04da9884b0dee0906dea.jpg",
    videoImageUrl: "/avatars/6aac1c198a9c04da9884b0dee0906dea.jpg",
    gender: "female",
    description: "Dynamic and energetic female presenter",
    category: ['female', 'game', 'electronic'],
    pose: 'standing'
  },
  {
    id: "noah-standing",
    name: "Noah",
    imageUrl: "/avatars/799244c33aa10bd888a22bc84c9422b7.png",
    videoImageUrl: "/avatars/799244c33aa10bd888a22bc84c9422b7.png",
    gender: "male",
    description: "Confident and professional male presenter",
    category: ['male', 'finance', 'electronic'],
    pose: 'standing'
  },
  {
    id: "david2",
    name: "David (Alt)",
    imageUrl: "/avatars/b19a9d6cbc664132bb3e006f7ee7bae0.png",
    videoImageUrl: "/avatars/b19a9d6cbc664132bb3e006f7ee7bae0.png",
    gender: "male",
    description: "Approachable and friendly male spokesperson",
    category: ['male', 'supplement', 'pet'],
    pose: 'standing'
  },
  {
    id: "emma",
    name: "Emma",
    imageUrl: "/avatars/c394d43d9a63244234ef4c5f75a92b9c.png",
    videoImageUrl: "/avatars/c394d43d9a63244234ef4c5f75a92b9c.png",
    gender: "female",
    description: "Fresh and modern female presenter",
    category: ['female', 'beauty', 'clothing'],
    pose: 'standing'
  },
  {
    id: "alexander",
    name: "Alexander",
    imageUrl: "/avatars/c501e2819405b6cf72bd94f2e3edd53f.png",
    videoImageUrl: "/avatars/c501e2819405b6cf72bd94f2e3edd53f.png",
    gender: "male",
    description: "Professional and authoritative male spokesperson",
    category: ['male', 'finance', 'education'],
    pose: 'standing'
  },
  {
    id: "sofia-sitting",
    name: "Sofia",
    imageUrl: "/avatars/c851206b3889ebb7d2d565b57b8dd78a.png",
    videoImageUrl: "/avatars/c851206b3889ebb7d2d565b57b8dd78a.png",
    gender: "female",
    description: "Comfortable and engaging female presenter",
    category: ['female', 'supplement', 'beauty'],
    pose: 'sitting'
  }
];

const AVAILABLE_AVATARS: VideoAvatar[] = ORIGINAL_AVAILABLE_AVATARS.map(avatar => ({
  ...avatar,
  imageUrl: GLOBAL_AVATAR_URL,
  videoImageUrl: GLOBAL_AVATAR_URL
}));

export default function AvatarSelector({ onSelect, onClose, selectedAvatar }: AvatarSelectorProps) {
  const [currentSelection, setCurrentSelection] = useState<VideoAvatar | null>(selectedAvatar || null);

  const handleSelect = (avatar: VideoAvatar) => {
    setCurrentSelection(avatar);
  };

  const handleConfirm = () => {
    if (currentSelection) {
      onSelect(currentSelection);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Choose your favorite avatar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Toggle - keeping your design */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-gray-400">Choose your favorite avatar</span>
          <div className="relative inline-block w-12 h-6 bg-blue-600 rounded-full cursor-pointer">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transform translate-x-6 transition-transform"></div>
          </div>
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-6 gap-4 mb-6 max-h-96 overflow-y-auto">
          {AVAILABLE_AVATARS.map((avatar, index) => (
            <div
              key={avatar.id}
              className={`relative cursor-pointer transition-all ${
                currentSelection?.id === avatar.id
                  ? 'ring-2 ring-blue-500 scale-105'
                  : 'hover:scale-105'
              }`}
              onClick={() => handleSelect(avatar)}
            >
              {/* Avatar Image Container */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-800">
                {/* Actual avatar image */}
                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                {/* Fallback placeholder (hidden by default) */}
                <div className="hidden w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center absolute inset-0">
                  <div className="text-2xl font-bold text-gray-300">
                    {avatar.name.charAt(0)}
                  </div>
                </div>

                {/* Selection indicator */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                  currentSelection?.id === avatar.id
                    ? 'bg-blue-500'
                    : 'bg-transparent'
                }`}>
                  {currentSelection?.id === avatar.id && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Gender indicator */}
                <div className="absolute bottom-2 right-2">
                  <div className={`w-4 h-4 rounded-full ${
                    avatar.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                  }`}></div>
                </div>

                {/* Premium indicator for some avatars */}
                {(index === 4 || index === 7 || index === 11) && (
                  <div className="absolute top-2 left-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-black">★</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar Name */}
              <p className="text-sm text-center mt-2 text-gray-300 truncate">
                {avatar.name}
              </p>

              {/* Gender Icon */}
              <div className="text-center mt-1">
                <span className={`text-xs ${
                  avatar.gender === 'female' ? 'text-pink-400' : 'text-blue-400'
                }`}>
                  {avatar.gender === 'female' ? '♀' : '♂'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleConfirm}
            disabled={!currentSelection}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}