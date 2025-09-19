import type { ScrapeResponse } from './types';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  url: string;
}

export class CacheManager {
  private static readonly CACHE_PREFIX = '1click_product_cache_';
  private static readonly DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate a cache key from a URL
   */
  private static getCacheKey(url: string): string {
    // Normalize URL and create a simple hash-like key
    const normalizedUrl = url.toLowerCase().trim();
    return `${this.CACHE_PREFIX}${btoa(normalizedUrl).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  /**
   * Check if we're in a browser environment
   */
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Store data in cache with timestamp
   */
  static setCache<T>(url: string, data: T, expiryMs: number = this.DEFAULT_EXPIRY_MS): boolean {
    if (!this.isBrowser()) {
      console.warn('localStorage not available - caching disabled');
      return false;
    }

    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        url: url.trim()
      };

      const cacheKey = this.getCacheKey(url);
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      
      // Store expiry separately for easier cleanup
      localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + expiryMs).toString());
      
      console.log(`✅ Cached data for URL: ${url}`);
      return true;
    } catch (error) {
      console.error('Error storing cache:', error);
      return false;
    }
  }

  /**
   * Retrieve data from cache if valid and not expired
   */
  static getCache<T>(url: string): T | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(url);
      const expiryKey = `${cacheKey}_expiry`;
      
      const cachedData = localStorage.getItem(cacheKey);
      const expiryTime = localStorage.getItem(expiryKey);
      
      if (!cachedData || !expiryTime) {
        return null;
      }

      // Check if expired
      const expiry = parseInt(expiryTime, 10);
      if (Date.now() > expiry) {
        console.log(`🗑️ Cache expired for URL: ${url}`);
        this.removeCache(url);
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cachedData);
      console.log(`🎯 Cache hit for URL: ${url}`);
      return cacheEntry.data;
    } catch (error) {
      console.error('Error retrieving cache:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  static removeCache(url: string): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(url);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_expiry`);
      console.log(`🗑️ Removed cache for URL: ${url}`);
      return true;
    } catch (error) {
      console.error('Error removing cache:', error);
      return false;
    }
  }

  /**
   * Check if cache exists for a URL
   */
  static hasCache(url: string): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    const cacheKey = this.getCacheKey(url);
    const expiryKey = `${cacheKey}_expiry`;
    
    const cachedData = localStorage.getItem(cacheKey);
    const expiryTime = localStorage.getItem(expiryKey);
    
    if (!cachedData || !expiryTime) {
      return false;
    }

    // Check if expired
    const expiry = parseInt(expiryTime, 10);
    if (Date.now() > expiry) {
      this.removeCache(url);
      return false;
    }

    return true;
  }

  /**
   * Clear all product caches
   */
  static clearAllCache(): number {
    if (!this.isBrowser()) {
      return 0;
    }

    let cleared = 0;
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
        cleared++;
      }
    }

    console.log(`🗑️ Cleared ${cleared} cache entries`);
    return cleared;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { totalEntries: number; totalSize: number; oldestEntry?: Date } {
    if (!this.isBrowser()) {
      return { totalEntries: 0, totalSize: 0 };
    }

    let totalEntries = 0;
    let totalSize = 0;
    let oldestTimestamp = Date.now();

    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(this.CACHE_PREFIX) && !key.endsWith('_expiry')) {
        totalEntries++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const cacheEntry: CacheEntry = JSON.parse(value);
            if (cacheEntry.timestamp < oldestTimestamp) {
              oldestTimestamp = cacheEntry.timestamp;
            }
          } catch (error) {
            // Invalid cache entry, ignore
          }
        }
      }
    }

    return {
      totalEntries,
      totalSize,
      oldestEntry: totalEntries > 0 ? new Date(oldestTimestamp) : undefined
    };
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredCache(): number {
    if (!this.isBrowser()) {
      return 0;
    }

    let cleaned = 0;
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    for (const key of keys) {
      if (key.startsWith(this.CACHE_PREFIX) && key.endsWith('_expiry')) {
        const expiryTime = localStorage.getItem(key);
        if (expiryTime && parseInt(expiryTime, 10) < now) {
          const dataKey = key.replace('_expiry', '');
          localStorage.removeItem(key);
          localStorage.removeItem(dataKey);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
    
    return cleaned;
  }
}

/**
 * Product-specific cache utilities
 */
export class ProductCacheManager {
  /**
   * Cache product scrape response
   */
  static cacheProductData(url: string, response: ScrapeResponse): boolean {
    return CacheManager.setCache(url, response);
  }

  /**
   * Get cached product data
   */
  static getCachedProductData(url: string): ScrapeResponse | null {
    return CacheManager.getCache<ScrapeResponse>(url);
  }

  /**
   * Check if product data is cached
   */
  static hasProductCache(url: string): boolean {
    return CacheManager.hasCache(url);
  }

  /**
   * Remove product cache
   */
  static removeProductCache(url: string): boolean {
    return CacheManager.removeCache(url);
  }
}
