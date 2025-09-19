import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApifyClient } from 'apify-client';
import { ImageProcessor } from '@/lib/image-processor';
import type { ScrapeResponse } from '@/lib/types';

// Simple in-memory cache for server-side caching
interface ServerCacheEntry {
  data: ScrapeResponse;
  timestamp: number;
  url: string;
}

class ServerCache {
  private static cache = new Map<string, ServerCacheEntry>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getCacheKey(url: string): string {
    return Buffer.from(url.toLowerCase().trim()).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }

  static set(url: string, data: ScrapeResponse): void {
    const key = this.getCacheKey(url);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      url: url.trim()
    });
    console.log(`🗄️ Server cache stored for: ${url}`);
  }

  static get(url: string): ScrapeResponse | null {
    const key = this.getCacheKey(url);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      console.log(`🗑️ Server cache expired for: ${url}`);
      return null;
    }

    console.log(`🎯 Server cache hit for: ${url}`);
    return entry.data;
  }

  static has(url: string): boolean {
    const cached = this.get(url);
    return cached !== null;
  }

  static clear(): void {
    this.cache.clear();
    console.log('🗑️ Server cache cleared');
  }

  static cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired server cache entries`);
    }
    
    return cleaned;
  }
}

// Configure maximum duration for this function (300 seconds to match Vercel Hobby plan limit)
export const maxDuration = 300;

const scrapeRequestSchema = z.object({
  url: z.string().url(),
  maxItems: z.number().optional().default(100),
  maxPages: z.number().optional().default(9999),
});

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request
    const validation = scrapeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json<ScrapeResponse>(
        {
          success: false,
          error: "Invalid URL or parameters",
        },
        { status: 400 }
      );
    }

    const { url, maxItems, maxPages } = validation.data;

    // Clean up expired cache entries periodically
    ServerCache.cleanup();

    // Check server-side cache first
    const cachedResponse = ServerCache.get(url);
    if (cachedResponse) {
      console.log(`🎯 Returning cached response for: ${url}`);
      return NextResponse.json<ScrapeResponse>(cachedResponse, {
        headers: {
          'X-Cache-Status': 'HIT',
          'X-Cache-Timestamp': new Date().toISOString(),
        }
      });
    }

    console.log(`🌐 Cache miss - proceeding with fresh scrape for: ${url}`);

    // Check if APIFY_TOKEN is configured
    const apifyToken = process.env.APFIY_TOKEN;
    if (!apifyToken) {
      return NextResponse.json<ScrapeResponse>(
        {
          success: false,
          error: "Apify token is not configured. Please set APFIY_TOKEN in environment variables.",
        },
        { status: 503 }
      );
    }

    // Initialize the ApifyClient with your Apify API token
    const client = new ApifyClient({
      token: apifyToken,
    });

    // According to Apify documentation, categoryUrls is required and accepts both category and product URLs
    const input = {
      categoryUrls: [{ url }],
      maxItemsPerStartUrl: maxItems,
      maxSearchPagesPerStartUrl: maxPages,
      scrapeProductDetails: true,
      useCaptchaSolver: false,
      scrapeProductVariantPrices: false,
      ensureLoadedProductDescriptionFields: true
    };

    console.log('Starting Apify scraper with input:', input);

    // Run the Actor and wait for it to finish
    const run = await client.actor("junglee/free-amazon-product-scraper").call(input);

    console.log('Apify run completed:', run.id);
    console.log(`💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);

    // Fetch and return Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return NextResponse.json<ScrapeResponse>(
        {
          success: false,
          error: "No products found for the given URL",
        },
        { status: 404 }
      );
    }

    // Get the first item (most relevant product)
    const firstItem = items[0] as Record<string, unknown>;

    // Keep raw data for additional information like high-resolution images
    const rawData = firstItem;

    // Transform to ProductData format for compatibility
    const priceData = firstItem.price as { value?: number; currency?: string } | undefined;
    
    // Process and validate image URLs
    const imageUrls = [
      firstItem.thumbnailImage as string,
      ...(firstItem.highResolutionImages as string[] || []),
      firstItem.image as string
    ].filter(Boolean);

    console.log(`🖼️ Found ${imageUrls.length} potential image URLs`);
    
    let processedImageUrl = '';
    if (imageUrls.length > 0) {
      try {
        const bestImage = await ImageProcessor.getBestImageUrl(imageUrls);
        processedImageUrl = bestImage.processedUrl;
        console.log(`✅ Selected best image using ${bestImage.processingMethod} method: ${processedImageUrl}`);
      } catch (error) {
        console.warn('⚠️ Image processing failed, using fallback:', error);
        processedImageUrl = imageUrls[0] || '';
      }
    }

    const productData = {
      title: (firstItem.title as string) || 'Unknown Product',
      description: (firstItem.description as string) || 'No description available',
      price: priceData?.value
        ? `$${priceData.value}`
        : (firstItem.priceRange as string) || 'Price not available',
      features: (firstItem.features as string[]) || [],
      imageUrl: processedImageUrl,
    };

    const response: ScrapeResponse = {
      success: true,
      data: productData,
      rawData: rawData,
    };

    // Cache the successful response
    ServerCache.set(url, response);

    return NextResponse.json<ScrapeResponse>(response, {
      headers: {
        'X-Cache-Status': 'MISS',
        'X-Cache-Timestamp': new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Error in scrape-product API:", error);
    
    return NextResponse.json<ScrapeResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred while scraping the product",
      },
      { status: 500 }
    );
  }
}