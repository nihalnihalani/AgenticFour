import { z } from 'zod';

// Schema for Amazon product data from Apify
export const AmazonProductSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  asin: z.string().optional(),
  originalAsin: z.string().optional(),
  price: z.object({
    value: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  inStock: z.boolean().optional(),
  inStockText: z.string().optional(),
  listPrice: z.number().nullable().optional(),
  brand: z.string().optional(),
  author: z.string().nullable().optional(),
  shippingPrice: z.number().nullable().optional(),
  stars: z.number().optional(),
  starsBreakdown: z.object({
    "5star": z.number().optional(),
    "4star": z.number().optional(),
    "3star": z.number().optional(),
    "2star": z.number().optional(),
    "1star": z.number().optional(),
  }).optional(),
  reviewsCount: z.number().optional(),
  answeredQuestions: z.number().nullable().optional(),
  breadCrumbs: z.string().optional(),
  videosCount: z.number().optional(),
  visitStoreLink: z.object({
    text: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
  thumbnailImage: z.string().optional(),
  galleryThumbnails: z.array(z.string()).optional(),
  highResolutionImages: z.array(z.string()).optional(),
  importantInformation: z.object({
    title: z.string().optional(),
    items: z.array(z.object({
      title: z.string().optional(),
      text: z.string().optional(),
      url: z.string().nullable().optional(),
    })).optional(),
  }).optional(),
  sustainabilityFeatures: z.any().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
  attributes: z.array(z.object({
    key: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  productOverview: z.array(z.object({
    key: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  variantAsins: z.array(z.string()).optional(),
  variantDetails: z.array(z.any()).optional(),
  reviewsLink: z.string().optional(),
  hasReviews: z.boolean().optional(),
  delivery: z.string().optional(),
  fastestDelivery: z.string().nullable().optional(),
  returnPolicy: z.string().nullable().optional(),
  support: z.string().nullable().optional(),
  variantAttributes: z.array(z.object({
    key: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  manufacturerAttributes: z.array(z.any()).optional(),
  seller: z.object({
    name: z.string().optional(),
    id: z.string().optional(),
    url: z.string().optional(),
    reviewsCount: z.number().nullable().optional(),
    averageRating: z.number().nullable().optional(),
  }).optional(),
  bestsellerRanks: z.array(z.object({
    rank: z.number().optional(),
    category: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
  isAmazonChoice: z.boolean().optional(),
  amazonChoiceText: z.string().nullable().optional(),
  bookDescription: z.string().nullable().optional(),
  priceRange: z.string().nullable().optional(),
  aPlusContent: z.any().optional(),
  brandStory: z.any().nullable().optional(),
  productComparison: z.any().nullable().optional(),
  aiReviewsSummary: z.any().optional(),
  monthlyPurchaseVolume: z.number().nullable().optional(),
  productPageReviews: z.array(z.any()).optional(),
  productPageReviewsFromOtherCountries: z.array(z.any()).optional(),
  locationText: z.string().optional(),
  loadedCountryCode: z.string().optional(),
  offers: z.array(z.any()).optional(),
  unNormalizedProductUrl: z.string().optional(),
  input: z.string().optional(),
});

export type AmazonProduct = z.infer<typeof AmazonProductSchema>;

// Legacy schema for backward compatibility
export const ProductDataSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.string().min(1, "El precio es requerido"),
  features: z.array(z.string()),
  imageUrl: z.string().url("URL de imagen inválida").or(z.literal("")),
});

export type ProductData = z.infer<typeof ProductDataSchema>;

// Esquema para el prompt de anuncio generado por Gemini
export const AdPromptSchema = z.object({
  style: z.string(),
  background: z.string(),
  mainElements: z.string(),
  text: z.object({
    headline: z.string(),
    tagline: z.string(),
    callToAction: z.string(),
  }),
  colors: z.string(),
  composition: z.string(),
  mood: z.string(),
});

export type AdPrompt = z.infer<typeof AdPromptSchema>;

// Tipo para la respuesta de la API de scraping
export interface ScrapeResponse {
  success: boolean;
  data?: ProductData | AmazonProduct | AmazonProduct[];
  error?: string;
}

// Tipo para la respuesta de generación de anuncio
export interface GenerateAdResponse {
  success: boolean;
  imageBase64?: string;
  prompt?: AdPrompt;
  error?: string;
}

// Estados de la aplicación
export type AppStatus = 'idle' | 'scraping' | 'generating' | 'success' | 'error';

// Configuración del formulario manual
export const ManualProductFormSchema = ProductDataSchema.extend({
  imageFile: z.instanceof(File).optional().or(z.undefined()),
});

export type ManualProductFormData = z.infer<typeof ManualProductFormSchema>;

// Tipo para el modo de entrada
export type InputMode = 'url' | 'manual';

// Configuración de la aplicación
export interface AppConfig {
  firecrawlEnabled: boolean;
  geminiEnabled: boolean;
}