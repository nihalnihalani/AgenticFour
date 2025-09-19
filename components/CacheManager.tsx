"use client";

import { useState, useEffect } from "react";
import { Trash2, RefreshCw, Database, Clock, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProductCache } from "@/lib/hooks/use-product-cache";

export interface CacheManagerProps {
  className?: string;
}

const CacheManager: React.FC<CacheManagerProps> = ({ className }) => {
  const { cacheStats, clearAllCache } = useProductCache();
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const cleared = clearAllCache();
      if (cleared > 0) {
        setLastCleared(new Date());
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className={`p-4 bg-gray-900/80 backdrop-blur-sm border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Cache Manager</h3>
        </div>
        <Button
          onClick={handleClearCache}
          disabled={isClearing || cacheStats.totalEntries === 0}
          variant="outline"
          size="sm"
          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
        >
          {isClearing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Clear Cache
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Entries */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-400">Cached Products</span>
          </div>
          <div className="text-xl font-bold text-white">
            {cacheStats.totalEntries}
          </div>
        </div>

        {/* Storage Size */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-400">Storage Used</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(cacheStats.totalSize)}
          </div>
        </div>

        {/* Oldest Entry */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Oldest Entry</span>
          </div>
          <div className="text-xl font-bold text-white">
            {cacheStats.oldestEntry ? formatTimeAgo(cacheStats.oldestEntry) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Cache Status */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {cacheStats.totalEntries === 0 
              ? 'No cached data' 
              : `${cacheStats.totalEntries} product${cacheStats.totalEntries === 1 ? '' : 's'} cached`
            }
          </span>
          {lastCleared && (
            <span className="text-gray-500">
              Last cleared: {formatTimeAgo(lastCleared)}
            </span>
          )}
        </div>
        
        {cacheStats.totalEntries > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500">
              💡 Cached products load instantly and save API costs
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CacheManager;
