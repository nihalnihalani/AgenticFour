import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAdPrompt, generateAdvertisementImage } from '@/lib/gemini';
import { ProductDataSchema, AmazonProductSchema } from '@/lib/types';
import type { GenerateAdResponse, AmazonProduct } from '@/lib/types';

// Configure maximum duration for this function (300 seconds for Hobby plan)
export const maxDuration = 300;

const generateAdRequestSchema = z.object({
  productData: z.union([
    ProductDataSchema,
    AmazonProductSchema,
    z.array(AmazonProductSchema)
  ]),
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
    
    // Validar el request
    const validation = generateAdRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json<GenerateAdResponse>(
        {
          success: false,
          error: "Datos del producto inválidos",
        },
        { status: 400 }
      );
    }

    const { productData } = validation.data;

    // Transform Amazon product data to ProductData format if needed
    const transformedProductData = transformToProductData(productData);

    // Verificar que la API key de Gemini esté configurada
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json<GenerateAdResponse>(
        {
          success: false,
          error: "La API de Gemini no está configurada. Por favor configura GEMINI_API_KEY en las variables de entorno.",
        },
        { status: 503 }
      );
    }

    try {
      // Generar el prompt estructurado con Gemini
      console.log("Generando prompt con Gemini...");
      const adPrompt = await generateAdPrompt(transformedProductData);
      console.log("Prompt generado:", adPrompt);

      // Generar la imagen del anuncio
      console.log("Generando imagen del anuncio...");
      console.log("Product image URL:", transformedProductData.imageUrl);
      const imageBase64 = await generateAdvertisementImage(adPrompt, transformedProductData.imageUrl);
      console.log("Imagen generada exitosamente");

      return NextResponse.json<GenerateAdResponse>({
        success: true,
        imageBase64,
        prompt: adPrompt,
      });

    } catch (error) {
      console.error("Error generando anuncio:", error);
      
      // Manejar errores específicos de Gemini
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          return NextResponse.json<GenerateAdResponse>(
            {
              success: false,
              error: "Error de autenticación con Gemini. Verifica tu API key.",
            },
            { status: 401 }
          );
        }
        
        if (error.message.includes("quota") || error.message.includes("limit")) {
          return NextResponse.json<GenerateAdResponse>(
            {
              success: false,
              error: "Se ha excedido la cuota de la API de Gemini. Intenta más tarde.",
            },
            { status: 429 }
          );
        }

        // Handle image-related errors
        if (error.message.includes("imagen del producto") || error.message.includes("Image not found") || error.message.includes("Failed to fetch image")) {
          return NextResponse.json<GenerateAdResponse>(
            {
              success: false,
              error: error.message,
            },
            { status: 400 }
          );
        }
      }

      throw error;
    }

  } catch (error) {
    console.error("Error in generate-ad API:", error);
    
    return NextResponse.json<GenerateAdResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al generar el anuncio",
      },
      { status: 500 }
    );
  }
}

// Helper function to transform Amazon product data to ProductData format
function transformToProductData(productData: any): {
  title: string;
  description: string;
  price: string;
  features?: string[];
  imageUrl?: string;
} {
  // Handle array of products - use the first one
  if (Array.isArray(productData)) {
    productData = productData[0];
  }

  // If it's already in ProductData format, return as is
  if (productData.title && productData.description && productData.price && typeof productData.price === 'string') {
    return productData;
  }

  // Transform Amazon product data
  const amazonProduct = productData as AmazonProduct;
  
  return {
    title: amazonProduct.title || 'Product',
    description: amazonProduct.description || 
                amazonProduct.features?.join('. ') || 
                'High-quality product',
    price: amazonProduct.price?.value ? 
           `${amazonProduct.price.currency}${amazonProduct.price.value}` : 
           'Contact for price',
    features: amazonProduct.features || [],
    imageUrl: amazonProduct.thumbnailImage || 
              amazonProduct.highResolutionImages?.[0] || 
              ''
  };
}