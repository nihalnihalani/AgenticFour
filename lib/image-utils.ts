// Dynamic import for sharp to avoid build issues
let sharp: typeof import('sharp') | null = null;

// Try to load sharp if available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sharp = require('sharp');
} catch {
  console.log('Sharp module not available, using fallback for image processing');
}

// Gemini supported image formats
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export interface ProcessedImage {
  base64: string;
  mimeType: string;
}

/**
 * Validates and converts images to Gemini-supported formats
 */
export async function processImageForGemini(
  imageBuffer: ArrayBuffer | Buffer,
  originalMimeType: string
): Promise<ProcessedImage> {
  const buffer = Buffer.isBuffer(imageBuffer) 
    ? imageBuffer 
    : Buffer.from(imageBuffer);

  // Check if the format is already supported
  if (SUPPORTED_MIME_TYPES.includes(originalMimeType)) {
    return {
      base64: buffer.toString('base64'),
      mimeType: originalMimeType
    };
  }

  // If sharp is not available and format is not supported, throw error
  if (!sharp) {
    console.error(`⚠️ Unsupported image format: ${originalMimeType}. Sharp module not available for conversion.`);
    throw new Error(`Unsupported image format: ${originalMimeType}. Please use JPEG, PNG, or WebP images.`);
  }

  console.log(`⚠️ Unsupported image format: ${originalMimeType}, converting to JPEG...`);

  try {
    // Convert to JPEG using sharp
    const convertedBuffer = await sharp(buffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      base64: convertedBuffer.toString('base64'),
      mimeType: 'image/jpeg'
    };
  } catch (error) {
    console.error('Error converting image:', error);
    throw new Error(`Failed to convert image from ${originalMimeType} to JPEG`);
  }
}

/**
 * Validates if a URL is properly formatted and accessible
 */
function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}


/**
 * Validates if an image URL is accessible
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/') === true;
  } catch {
    return false;
  }
}

/**
 * Fetches and processes an image from URL
 */
export async function fetchAndProcessImage(imageUrl: string): Promise<ProcessedImage> {
  // Validate URL format
  if (!isValidImageUrl(imageUrl)) {
    throw new Error(`Invalid image URL format: ${imageUrl}`);
  }

  const response = await fetch(imageUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  return processImageForGemini(imageBuffer, contentType);
}