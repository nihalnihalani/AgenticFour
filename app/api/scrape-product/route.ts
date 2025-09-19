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

    // Transform the data to match your expected format
    const transformedData = items.map((item: any) => ({
      title: item.title,
      url: item.url,
      asin: item.asin,
      price: item.price,
      inStock: item.inStock,
      brand: item.brand,
      stars: item.stars,
      reviewsCount: item.reviewsCount,
      thumbnailImage: item.thumbnailImage,
      highResolutionImages: item.highResolutionImages,
      description: item.description,
      features: item.features,
      attributes: item.attributes,
      delivery: item.delivery,
      seller: item.seller,
      // Include all other relevant fields from the response
      ...item
    }));

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