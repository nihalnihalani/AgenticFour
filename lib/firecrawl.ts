/**
 * @deprecated This module is no longer used in the application.
 * The app now uses Apify for product data extraction instead of Firecrawl.
 * This file is kept for backward compatibility only.
 */

import { validateImageUrl } from './image-utils';

export interface ProductData {
  title: string;
  description: string;
  price: string;
  features: string[];
  imageUrl: string;
}

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v2/scrape';
const FIRECRAWL_TIMEOUT = 290000; // 290 seconds timeout (less than Vercel's 300s to leave margin)

export class FirecrawlService {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async scrapeProduct(url: string): Promise<ProductData> {
    if (!this.apiKey) {
      throw new Error('Firecrawl is not configured. Please use the manual form.');
    }

    try {
      console.log('🔍 Starting scraping:', url);
      
      // Llamar a FireCrawl API v2 directamente
      const response = await fetch(FIRECRAWL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url,
          formats: [
            {
              type: "json",
              prompt: `Extract the following product information from this e-commerce page. Be very precise with the data extraction: 
                - productTitle (the main product name)
                - fullProductDescription (complete product description) 
                - priceWithCurrency (the actual selling price with currency symbol like $69.99)
                - keyFeatures (main product features as array, maximum 5)
                - mainProductImageUrl (the main product image URL)`
            },
            "links"
          ]
        }),
        signal: AbortSignal.timeout(FIRECRAWL_TIMEOUT)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ FireCrawl error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication error with Firecrawl. Please check your API key.');
        }
        
        throw new Error('Error extracting data from URL');
      }

      const firecrawlData = await response.json();
      console.log('✅ FireCrawl response received');
      
      // Log the entire response structure to understand what we're getting
      console.log('📦 FireCrawl data structure:', {
        hasData: !!firecrawlData.data,
        hasJson: !!firecrawlData.data?.json,
        hasLinks: !!firecrawlData.data?.links,
        hasScreenshot: !!firecrawlData.data?.screenshot,
        jsonKeys: firecrawlData.data?.json ? Object.keys(firecrawlData.data.json) : []
      });

      if (!firecrawlData.success || !firecrawlData.data) {
        throw new Error('Could not get data from URL');
      }

      // Intentar primero con la extracción JSON
      const jsonExtract = firecrawlData.data?.json;
      let productData: ProductData;

      if (jsonExtract) {
        console.log('📋 JSON data extracted:', jsonExtract);
        
        // Check if the image URL is valid before using it
        let imageUrl = jsonExtract.mainProductImageUrl || '';
        
        // Validate the extracted image URL
        if (imageUrl) {
          console.log('🔍 Validating extracted image URL:', imageUrl);
          const isValid = await validateImageUrl(imageUrl);
          
          if (!isValid) {
            console.log('❌ Extracted image URL is not accessible');
            
            // Try to find alternative images from links
            if (firecrawlData.data?.links) {
              console.log('🔍 Searching for alternative images in links...');
              const links = firecrawlData.data.links;
              
              // Find potential product images
              const imageLinks = links.filter((link: string) => 
                link.match(/\.(jpg|jpeg|png|webp)$/i) && 
                !link.includes('icon') && 
                !link.includes('logo') &&
                !link.includes('sprite') &&
                !link.includes('pixel')
              );
              
              console.log(`📸 Found ${imageLinks.length} potential image links`);
              
              // Validate each potential image
              for (const link of imageLinks) {
                const linkIsValid = await validateImageUrl(link);
                if (linkIsValid) {
                  console.log('✅ Found working image URL:', link);
                  imageUrl = link;
                  break;
                }
              }
            }
          } else {
            console.log('✅ Extracted image URL is valid');
          }
        }
        
        productData = {
          title: jsonExtract.productTitle || '',
          description: jsonExtract.fullProductDescription || '',
          price: jsonExtract.priceWithCurrency || '',
          features: Array.isArray(jsonExtract.keyFeatures) ? jsonExtract.keyFeatures.slice(0, 5) : [],
          imageUrl: imageUrl
        };
      } else {
        // Fallback: intentar con markdown/html si no hay JSON
        console.log('⚠️ No JSON extraction, trying with markdown/html');
        
        // Hacer otra llamada para obtener markdown y html
        const fallbackResponse = await fetch(FIRECRAWL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            url,
            formats: ["markdown", "html", "links"],
            onlyMainContent: false
          }),
          signal: AbortSignal.timeout(FIRECRAWL_TIMEOUT)
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.data) {
            productData = this.parseProductFromContent(
              fallbackData.data.markdown || '',
              fallbackData.data.html || '',
              fallbackData.data.metadata || {}
            );
          } else {
            throw new Error('Could not get page content');
          }
        } else {
          throw new Error('Error getting page content');
        }
      }

      // Validar que tenemos datos mínimos
      if (!productData.title && !productData.description && !productData.price) {
        throw new Error('Could not extract sufficient product data');
      }

      // Si no tenemos imagen, usar un placeholder
      if (!productData.imageUrl) {
        productData.imageUrl = '';
      }

      console.log('✅ Product data extracted:', {
        title: productData.title,
        price: productData.price,
        hasDescription: !!productData.description,
        featuresCount: productData.features.length,
        hasImage: !!productData.imageUrl
      });

      return productData;
    } catch (error) {
      console.error('Error scraping product:', error);
      
      if (error instanceof Error) {
        // Re-lanzar errores conocidos
        if (error.message.includes('Authentication') || 
            error.message.includes('manual') || 
            error.message.includes('suficientes')) {
          throw error;
        }
        
        // Manejar timeout
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new Error('El sitio web tardó demasiado en responder (más de 4 minutos). Por favor intenta con otra URL o usa el formulario manual.');
        }
      }
      
      throw new Error(`Error scraping product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseProductFromContent(markdown: string, html: string, metadata: Record<string, unknown>): ProductData {
    // Título
    let title = typeof metadata.title === 'string' ? metadata.title : '';
    if (!title) {
      const titleMatch = markdown.match(/^#\s+(.+)$/m) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      title = titleMatch ? titleMatch[1].trim() : '';
    }

    // Descripción
    let description = typeof metadata.description === 'string' ? metadata.description : '';
    if (!description) {
      const descMatch = markdown.match(/^[^#\n]{50,}$/m);
      description = descMatch ? descMatch[0].trim() : '';
    }

    // Precio - buscar patrones más específicos
    let price = '';
    const pricePatterns = [
      /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,  // $69.99, $1,299.00
      /USD\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,  // USD 69.99
      /€\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,    // €69.99
      /£\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,    // £69.99
    ];
    
    for (const pattern of pricePatterns) {
      const matches = [...(markdown.match(pattern) || []), ...(html.match(pattern) || [])];
      if (matches.length > 0) {
        // Ordenar por valor numérico y tomar el más alto (probablemente el precio principal)
        matches.sort((a, b) => {
          const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
          const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
          return numB - numA;
        });
        price = matches[0];
        break;
      }
    }

    // Características
    const features: string[] = [];
    const listMatches = markdown.match(/^[\*\-]\s+(.+)$/gm);
    if (listMatches) {
      features.push(...listMatches.slice(0, 5).map(f => f.replace(/^[\*\-]\s+/, '').trim()));
    }

    // Imagen
    let imageUrl = '';
    const imageMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imageMatch && imageMatch[1]) {
      // Filtrar imágenes que no sean del producto
      const imgSrc = imageMatch[1];
      if (!imgSrc.includes('logo') && 
          !imgSrc.includes('icon') && 
          !imgSrc.includes('banner') &&
          !imgSrc.includes('pixel') &&
          (imgSrc.includes('.jpg') || imgSrc.includes('.jpeg') || 
           imgSrc.includes('.png') || imgSrc.includes('.webp'))) {
        imageUrl = imgSrc;
      }
    }

    return {
      title: title || 'Product without title',
      description: description || 'No description available',
      price: price || 'Price not available',
      features,
      imageUrl
    };
  }
}

// Instancia singleton para usar en toda la aplicación
export const firecrawlService = new FirecrawlService();