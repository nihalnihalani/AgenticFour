import { validateImageUrl } from './image-utils';

export interface ImageProcessingResult {
  processedUrl: string;
  isValid: boolean;
  originalUrl: string;
  processingMethod: 'original' | 'converted' | 'proxy' | 'fallback';
  error?: string;
}

export class ImageProcessor {
  private static readonly FALLBACK_IMAGE = 'https://via.placeholder.com/400x400/cccccc/666666?text=Product+Image';
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT_MS = 10000; // 10 seconds

  /**
   * Process and validate image URL for Fal.ai compatibility
   */
  static async processImageUrl(imageUrl: string, baseUrl?: string): Promise<ImageProcessingResult> {
    if (!imageUrl || imageUrl.trim() === '') {
      return {
        processedUrl: this.FALLBACK_IMAGE,
        isValid: true,
        originalUrl: imageUrl,
        processingMethod: 'fallback',
        error: 'Empty image URL provided'
      };
    }

    let originalUrl = imageUrl.trim();
    
    try {
      // Handle relative URLs (like avatar images)
      if (originalUrl.startsWith('/')) {
        const domain = baseUrl || 'http://localhost:3000';
        originalUrl = `${domain}${originalUrl}`;
        console.log(`🔗 Converting relative URL to absolute: ${originalUrl}`);
      }
      
      // Step 1: Basic URL validation
      if (!this.isValidUrl(originalUrl)) {
        throw new Error('Invalid URL format');
      }

      // Step 2: Check if image is accessible
      const isAccessible = await this.checkImageAccessibility(originalUrl);
      if (isAccessible) {
        console.log('✅ Image URL is accessible:', originalUrl);
        return {
          processedUrl: originalUrl,
          isValid: true,
          originalUrl,
          processingMethod: 'original'
        };
      }

      // Step 3: Try URL transformations for Amazon images
      if (this.isAmazonImage(originalUrl)) {
        const transformedUrl = this.transformAmazonImageUrl(originalUrl);
        if (transformedUrl !== originalUrl) {
          const isTransformedAccessible = await this.checkImageAccessibility(transformedUrl);
          if (isTransformedAccessible) {
            console.log('✅ Transformed Amazon image URL is accessible:', transformedUrl);
            return {
              processedUrl: transformedUrl,
              isValid: true,
              originalUrl,
              processingMethod: 'converted'
            };
          }
        }
      }

      // Step 4: Try creating a proxy URL
      const proxyUrl = this.createProxyUrl(originalUrl);
      const isProxyAccessible = await this.checkImageAccessibility(proxyUrl);
      if (isProxyAccessible) {
        console.log('✅ Proxy image URL is accessible:', proxyUrl);
        return {
          processedUrl: proxyUrl,
          isValid: true,
          originalUrl,
          processingMethod: 'proxy'
        };
      }

      // Step 5: Use fallback image
      console.warn('⚠️ All image processing methods failed, using fallback');
      return {
        processedUrl: this.FALLBACK_IMAGE,
        isValid: true,
        originalUrl,
        processingMethod: 'fallback',
        error: 'Original image not accessible, using fallback'
      };

    } catch (error) {
      console.error('❌ Error processing image URL:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      // For debugging, let's be more permissive and allow the original URL through
      // if it's a valid URL format, even if accessibility check fails
      if (this.isValidUrl(originalUrl)) {
        console.warn('⚠️ Using original URL despite processing error');
        return {
          processedUrl: originalUrl,
          isValid: true,
          originalUrl,
          processingMethod: 'original',
          error: `Processing failed but using original URL: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      
      return {
        processedUrl: this.FALLBACK_IMAGE,
        isValid: true,
        originalUrl,
        processingMethod: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Check if image URL is accessible with timeout and retries
   */
  private static async checkImageAccessibility(url: string): Promise<boolean> {
    // For local development, skip accessibility check for localhost URLs
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.log(`🏠 Skipping accessibility check for local URL: ${url}`);
      return true;
    }

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          const isImage = contentType?.startsWith('image/') === true;
          console.log(`📋 Content-Type for ${url}: ${contentType}, isImage: ${isImage}`);
          return isImage;
        } else {
          console.warn(`❌ HTTP ${response.status} for ${url}`);
        }
      } catch (error) {
        console.warn(`Attempt ${attempt}/${this.MAX_RETRIES} failed for ${url}:`, error);
        if (attempt === this.MAX_RETRIES) {
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return false;
  }

  /**
   * Check if URL is from Amazon
   */
  private static isAmazonImage(url: string): boolean {
    return url.includes('amazon.com') || url.includes('ssl-images-amazon.com') || url.includes('media-amazon.com');
  }

  /**
   * Transform Amazon image URLs for better accessibility
   */
  private static transformAmazonImageUrl(url: string): string {
    try {
      // Remove WebP format and size constraints
      let transformedUrl = url
        .replace(/\._.*?_\./, '.')  // Remove size and format modifiers
        .replace(/\.webp$/, '.jpg') // Convert WebP to JPG
        .replace(/FMwebp_/, '')     // Remove WebP format specifier
        .replace(/QL\d+_/, '')      // Remove quality specifier
        .replace(/SX\d+_/, '')      // Remove width constraint
        .replace(/SY\d+_/, '');     // Remove height constraint

      // Ensure we have a proper image extension
      if (!transformedUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
        transformedUrl += '.jpg';
      }

      return transformedUrl;
    } catch (error) {
      console.warn('Error transforming Amazon URL:', error);
      return url;
    }
  }

  /**
   * Create a proxy URL using a public image proxy service
   */
  private static createProxyUrl(originalUrl: string): string {
    // Using images.weserv.nl as a free image proxy service
    const encodedUrl = encodeURIComponent(originalUrl);
    return `https://images.weserv.nl/?url=${encodedUrl}&output=jpg&q=80&w=800&h=800&fit=inside`;
  }

  /**
   * Process avatar image URL with proper domain resolution
   */
  static async processAvatarImageUrl(imageUrl: string, baseUrl?: string): Promise<ImageProcessingResult> {
    return this.processImageUrl(imageUrl, baseUrl);
  }

  /**
   * Batch process multiple image URLs
   */
  static async processMultipleImageUrls(urls: string[], baseUrl?: string): Promise<ImageProcessingResult[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.processImageUrl(url, baseUrl))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          processedUrl: this.FALLBACK_IMAGE,
          isValid: true,
          originalUrl: urls[index],
          processingMethod: 'fallback' as const,
          error: result.reason?.message || 'Processing failed'
        };
      }
    });
  }

  /**
   * Get the best quality image from multiple URLs
   */
  static async getBestImageUrl(urls: string[], baseUrl?: string): Promise<ImageProcessingResult> {
    if (urls.length === 0) {
      return {
        processedUrl: this.FALLBACK_IMAGE,
        isValid: true,
        originalUrl: '',
        processingMethod: 'fallback',
        error: 'No URLs provided'
      };
    }

    const results = await this.processMultipleImageUrls(urls, baseUrl);
    
    // Prioritize by processing method: original > converted > proxy > fallback
    const priorityOrder: Array<ImageProcessingResult['processingMethod']> = ['original', 'converted', 'proxy', 'fallback'];
    
    for (const method of priorityOrder) {
      const result = results.find(r => r.processingMethod === method && r.isValid);
      if (result) {
        return result;
      }
    }

    // Fallback to the first result
    return results[0];
  }
}
