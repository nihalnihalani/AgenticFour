import { useCallback, useEffect, useState } from 'react';
import { ProductCacheManager } from '../cache-utils';
import type { ScrapeResponse } from '../types';

export interface UseProductCacheOptions {
  enableCache?: boolean;
  cacheExpiryHours?: number;
}

export interface UseProductCacheReturn {
  getCachedData: (url: string) => ScrapeResponse | null;
  setCachedData: (url: string, data: ScrapeResponse) => boolean;
  hasCachedData: (url: string) => boolean;
  removeCachedData: (url: string) => boolean;
  clearAllCache: () => number;
  cacheStats: {
    totalEntries: number;
    totalSize: number;
    oldestEntry?: Date;
  };
  isLoading: boolean;
}

export const useProductCache = (options: UseProductCacheOptions = {}): UseProductCacheReturn => {
  const { enableCache = true, cacheExpiryHours = 24 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    totalEntries: 0,
    totalSize: 0,
    oldestEntry: undefined as Date | undefined
  });

  // Update cache stats
  const updateCacheStats = useCallback(() => {
    if (enableCache) {
      const stats = ProductCacheManager.getCacheStats();
      setCacheStats(stats);
    }
  }, [enableCache]);

  // Initialize and cleanup expired cache on mount
  useEffect(() => {
    if (enableCache) {
      ProductCacheManager.cleanupExpiredCache();
      updateCacheStats();
    }
  }, [enableCache, updateCacheStats]);

  const getCachedData = useCallback((url: string): ScrapeResponse | null => {
    if (!enableCache) return null;
    
    try {
      return ProductCacheManager.getCachedProductData(url);
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }, [enableCache]);

  const setCachedData = useCallback((url: string, data: ScrapeResponse): boolean => {
    if (!enableCache) return false;
    
    try {
      const success = ProductCacheManager.cacheProductData(url, data);
      if (success) {
        updateCacheStats();
      }
      return success;
    } catch (error) {
      console.error('Error setting cached data:', error);
      return false;
    }
  }, [enableCache, updateCacheStats]);

  const hasCachedData = useCallback((url: string): boolean => {
    if (!enableCache) return false;
    
    try {
      return ProductCacheManager.hasProductCache(url);
    } catch (error) {
      console.error('Error checking cached data:', error);
      return false;
    }
  }, [enableCache]);

  const removeCachedData = useCallback((url: string): boolean => {
    if (!enableCache) return false;
    
    try {
      const success = ProductCacheManager.removeProductCache(url);
      if (success) {
        updateCacheStats();
      }
      return success;
    } catch (error) {
      console.error('Error removing cached data:', error);
      return false;
    }
  }, [enableCache, updateCacheStats]);

  const clearAllCache = useCallback((): number => {
    if (!enableCache) return 0;
    
    try {
      const cleared = ProductCacheManager.clearAllCache();
      updateCacheStats();
      return cleared;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return 0;
    }
  }, [enableCache, updateCacheStats]);

  return {
    getCachedData,
    setCachedData,
    hasCachedData,
    removeCachedData,
    clearAllCache,
    cacheStats,
    isLoading
  };
};

/**
 * Hook for fetching product data with caching
 */
export const useProductDataWithCache = (options: UseProductCacheOptions = {}) => {
  const cache = useProductCache(options);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductData = useCallback(async (url: string): Promise<ScrapeResponse | null> => {
    if (!url) return null;

    // Check cache first
    const cachedData = cache.getCachedData(url);
    if (cachedData) {
      console.log('🎯 Using cached product data for:', url);
      return cachedData;
    }

    // Fetch from API
    setIsLoading(true);
    setError(null);

    try {
      console.log('🌐 Fetching fresh product data for:', url);
      
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data: ScrapeResponse = await response.json();

      if (data.success) {
        // Cache the successful response
        cache.setCachedData(url, data);
        console.log('✅ Product data fetched and cached');
        return data;
      } else {
        setError(data.error || 'Failed to fetch product data');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error fetching product data:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cache]);

  return {
    ...cache,
    fetchProductData,
    isLoading,
    error,
  };
};
