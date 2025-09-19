import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApifyClient } from 'apify-client';
import type { ScrapeResponse } from '@/lib/types';

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

    // Transform the data to match AmazonProduct format
    const transformedData = items.map((item: unknown) => {
      const itemData = item as Record<string, unknown>;
      return {
        title: itemData.title as string | undefined,
        url: itemData.url as string | undefined,
        asin: itemData.asin as string | undefined,
        price: itemData.price as { value?: number; currency?: string } | undefined,
        inStock: itemData.inStock as boolean | undefined,
        brand: itemData.brand as string | undefined,
        stars: itemData.stars as number | undefined,
        reviewsCount: itemData.reviewsCount as number | undefined,
        thumbnailImage: itemData.thumbnailImage as string | undefined,
        highResolutionImages: itemData.highResolutionImages as string[] | undefined,
        description: itemData.description as string | null | undefined,
        features: itemData.features as string[] | undefined,
        attributes: itemData.attributes as Array<{ key?: string; value?: string }> | undefined,
        delivery: itemData.delivery as string | undefined,
        seller: itemData.seller as {
          name?: string;
          id?: string;
          url?: string;
          reviewsCount?: number | null;
          averageRating?: number | null;
        } | undefined,
      };
    });

    return NextResponse.json<ScrapeResponse>({
      success: true,
      data: transformedData,
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