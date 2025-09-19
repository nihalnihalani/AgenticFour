import { ProductCacheManager } from './cache-utils';
import type { ScrapeResponse } from './types';

export interface ProductServiceOptions {
  enableCache?: boolean;
  cacheExpiryMs?: number;
  forceRefresh?: boolean;
}

export class ProductService {
  private static readonly DEFAULT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch product data with caching support
   */
  static async fetchProductData(
    url: string, 
    options: ProductServiceOptions = {}
  ): Promise<ScrapeResponse> {
    const {
      enableCache = true,
      cacheExpiryMs = this.DEFAULT_CACHE_EXPIRY,
      forceRefresh = false
    } = options;

    // Check cache first (unless force refresh is requested)
    if (enableCache && !forceRefresh) {
      const cachedData = ProductCacheManager.getCachedProductData(url);
      if (cachedData) {
        console.log('🎯 Cache hit - returning cached product data for:', url);
        return cachedData;
      }
    }

    console.log('🌐 Cache miss - fetching fresh product data for:', url);

    try {
      // Make API request
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          _cacheKey: this.generateCacheKey(url),
          _timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ScrapeResponse = await response.json();

      // Cache successful responses
      if (enableCache && data.success) {
        const cached = ProductCacheManager.cacheProductData(url, data);
        if (cached) {
          console.log('✅ Product data cached successfully for:', url);
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching product data:', error);
      
      // Return error response in expected format
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product data'
      };
    }
  }

  /**
   * Check if product data is cached
   */
  static hasCache(url: string): boolean {
    return ProductCacheManager.hasProductCache(url);
  }

  /**
   * Get cached product data without making API call
   */
  static getCachedData(url: string): ScrapeResponse | null {
    return ProductCacheManager.getCachedProductData(url);
  }

  /**
   * Remove cached data for a specific URL
   */
  static clearCache(url: string): boolean {
    return ProductCacheManager.removeProductCache(url);
  }

  /**
   * Clear all cached product data
   */
  static clearAllCache(): number {
    return ProductCacheManager.clearAllCache();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return ProductCacheManager.getCacheStats();
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupCache(): number {
    return ProductCacheManager.cleanupExpiredCache();
  }

  /**
   * Generate a consistent cache key for a URL
   */
  private static generateCacheKey(url: string): string {
    return btoa(url.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Preload product data (useful for prefetching)
   */
  static async preloadProductData(urls: string[]): Promise<void> {
    const uncachedUrls = urls.filter(url => !this.hasCache(url));
    
    if (uncachedUrls.length === 0) {
      console.log('🎯 All URLs already cached');
      return;
    }

    console.log(`🚀 Preloading ${uncachedUrls.length} uncached URLs`);
    
    // Fetch in parallel but limit concurrency to avoid overwhelming the API
    const BATCH_SIZE = 3;
    for (let i = 0; i < uncachedUrls.length; i += BATCH_SIZE) {
      const batch = uncachedUrls.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(url => this.fetchProductData(url))
      );
    }
  }

  /**
   * Validate and normalize URL
   */
  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch (error) {
      throw new Error('Invalid URL provided');
    }
  }

  /**
   * Check if URL is supported for scraping
   */
  static isSupportedUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Add supported domains here
      const supportedDomains = [
        'amazon.com',
        'amazon.co.uk',
        'amazon.ca',
        'amazon.de',
        'amazon.fr',
        'amazon.it',
        'amazon.es',
        'amazon.in',
        'amazon.com.au',
        'amazon.co.jp'
      ];
      
      return supportedDomains.some(domain => 
        urlObj.hostname.includes(domain)
      );
    } catch (error) {
      return false;
    }
  }
}
