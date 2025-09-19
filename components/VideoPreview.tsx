"use client";

import { useState, useRef } from "react";
import { Play, Pause, Download, Edit3, MoreHorizontal, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VideoScript } from "@/lib/types";

interface VideoPreviewProps {
  videoUrl: string;
  script?: VideoScript;
  title?: string;
  onEdit?: () => void;
  onGenerateMore?: () => void;
  onDownload?: () => void;
  isProcessing?: boolean;
}

export default function VideoPreview({
  videoUrl,
  script,
  title = "Generated Video",
  onEdit,
  onGenerateMore,
  onDownload,
  isProcessing = false
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickRatio = clickX / rect.width;
      const newTime = clickRatio * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  if (isProcessing) {
    return (
      <Card className="p-6 bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Generating video...</p>
            <p className="text-gray-500 text-sm mt-2">This may take up to 2 minutes</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Player Card */}
      <Card className="overflow-hidden bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
              onClick={handlePlayPause}
            >
              <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-4 transition-colors">
                <Play className="h-8 w-8 text-white fill-current" />
              </div>
            </div>
          )}

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div
              className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-3"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 fill-current" />
                  )}
                </button>

                <button className="text-white hover:text-blue-400 transition-colors">
                  <Volume2 className="h-5 w-5" />
                </button>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:text-blue-400 hover:bg-white/10"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>

                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-blue-400 hover:bg-white/10"
                    onClick={onEdit}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:text-blue-400 hover:bg-white/10"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>

        {onEdit && (
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Edit3 className="h-4 w-4" />
            Edit Video
          </Button>
        )}

        {onGenerateMore && (
          <Button
            onClick={onGenerateMore}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Generate More
          </Button>
        )}
      </div>

      {/* Script Information */}
      {script && (
        <Card className="p-4 bg-gray-900/60 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Video Script</h3>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-blue-400 mb-1">Introduction:</h4>
              <p className="text-gray-300">{script.introduction}</p>
            </div>

            <div>
              <h4 className="font-medium text-blue-400 mb-1">Key Highlights:</h4>
              <ul className="text-gray-300 list-disc list-inside space-y-1">
                {script.productHighlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-400 mb-1">Call to Action:</h4>
              <p className="text-gray-300">{script.callToAction}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}