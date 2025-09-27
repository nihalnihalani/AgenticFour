import { GoogleGenAI } from "@google/genai";
import type { Part } from "@google/genai";
import type { AdPrompt, VideoScript } from "./types";
import { fetchAndProcessImage } from "./image-utils";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// Master prompt for Gemini - Adapted from GPT-4o prompt
const MASTER_PROMPT = `You are a specialized generator of advertising prompts for high-quality static advertisements.
You will be provided with product or service context information (e.g., name, description, brand, price, slogan, benefits, target).

Your task is to generate a JSON following exactly the base structure below (already predefined in sections like: style, style_parameters, composition, color_psychology, typography_strategy, target_audience, etc.), but you must **integrate the relevant product data within that JSON**, only those that really improve the clarity, persuasion and attractiveness of the advertisement.

### Key instructions:
1. **Respect the original JSON structure** (do not delete sections).
2. **Insert product data into the appropriate sections**. Examples:
   - Product name and slogan → typography_strategy.headline_impact or composition.focal_point_strategy.
   - Main benefits → persuasive_elements.value_proposition.
   - Price or promotion → call_to_action.urgency or persuasive_elements.scarcity_indicators.
   - Logo / brand → brand_integration.logo_placement and brand_integration.color_consistency.
   - Target → target_audience.
3. **Don't saturate the ad**: include only what is most useful and attractive, avoid redundancies or technical information that doesn't add visual or persuasive value.
4. **Optimize for static advertisement**: the final result should be clear, memorable and with effective visual hierarchy.
5. If the product information doesn't apply to a field, keep the generic description from the original JSON.
6. **IMPORTANT TEXT LENGTH RULE**: All text values in the JSON must be 8 words or less. Use concise, impactful phrases. For longer concepts, use comma-separated keywords instead of full sentences.
7. **CRITICAL BACKGROUND RULES**: 
   - ONLY use neutral/minimalist backgrounds for elegant or luxury products (jewelry, watches, premium tech, high-end fashion)
   - For ALL OTHER products, create vibrant, themed backgrounds that match the product's environment:
     - Food → kitchen, restaurant, picnic scenes
     - Sports → outdoor fields, gyms, action scenes
     - Toys → playful, colorful environments
     - Electronics → modern tech environments
     - Beauty → spa, salon, lifestyle settings
   - The background MUST enhance the product's appeal and context
8. **TYPOGRAPHY RULES**: 
   - Product name typography MUST be industry-specific and attractive:
     - Food → bold, appetizing fonts (handwritten for artisanal, bold sans for fast food)
     - Tech → modern, sleek fonts (futuristic or minimal)
     - Fashion → elegant serif or stylish sans-serif
     - Sports → dynamic, strong fonts with motion
     - Kids → playful, fun, colorful fonts
   - The font must immediately communicate the product category
9. **PRICE INCLUSION**: If a price is provided in the input, you MUST include it in the JSON, typically in:
   - call_to_action.urgency (e.g., "Limited offer $29.99")
   - persuasive_elements.value_proposition (e.g., "Premium quality only $49")
   - Never invent or guess prices - only use the exact price provided
10. **LANGUAGE RULE**: Generate ALL text content in the JSON in the SAME LANGUAGE as the product description provided. If the description is in Spanish, generate Spanish content. If in English, generate English content.
11. **CRITICAL CONTACT INFORMATION RULES - ZERO TOLERANCE**: 
    - NEVER include ANY phone number in the JSON - no phone numbers are allowed
    - If NO URL was provided in the product data, DO NOT include ANY website URL anywhere in the JSON
    - FORBIDDEN: Never invent URLs like "www.example.com", "www.product.com", etc.
    - NEVER invent, generate, or guess ANY contact information (URL, email, address, phone)
    - Only use the EXACT URL provided if one exists (character by character)
    - If you need to reference contact but none was provided, use ONLY generic action words like "Contact us", "Visit store", "Learn more" WITHOUT any specific contact details
    - Phone numbers are EXPLICITLY PROHIBITED in all advertisements

### Expected output:
A complete JSON (with the same original structure) but enriched with product data, integrated only where they are most useful for an attractive and persuasive static advertisement.

### JSON Structure:
{
  "style": "advertisement",
  "style_parameters": {
    "visual_hierarchy": {
      "primary_focus": "product or service prominently featured",
      "secondary_elements": "supporting benefits and features",
      "tertiary_details": "fine print, logos, contact information",
      "attention_flow": "guided eye movement through strategic placement",
      "size_relationships": "proportional emphasis based on importance"
    },
    "brand_integration": {
      "logo_placement": "prominent but tasteful positioning",
      "color_consistency": "brand colors throughout design",
      "font_selection": "brand-appropriate typography",
      "tone_alignment": "messaging matches brand personality",
      "visual_identity": "consistent with brand guidelines"
    },
    "persuasive_elements": {
      "value_proposition": "clear benefit communication",
      "emotional_triggers": "desire, urgency, aspiration, security",
      "social_proof": "testimonials, ratings, popularity indicators",
      "scarcity_indicators": "limited time, exclusive offers",
      "trust_signals": "guarantees, certifications, endorsements"
    },
    "call_to_action": {
      "visibility": "prominently displayed action request",
      "urgency": "compelling reason to act now",
      "clarity": "exactly what user should do next",
      "accessibility": "easy to find and execute",
      "motivation": "clear benefit for taking action"
    },
    "layout_principles": {
      "balance": "visual weight distribution",
      "contrast": "elements stand out from background",
      "alignment": "organized, professional appearance",
      "proximity": "related elements grouped together",
      "repetition": "consistent design patterns"
    }
  },
  "composition": {
    "format_optimization": "designed for intended media placement",
    "readability_distance": "appropriate for viewing context",
    "focal_point_strategy": "single primary attention grabber",
    "white_space_usage": "breathing room for key elements",
    "grid_system": "structured, professional layout",
    "background_environment": "contextual scene matching product category"
  },
  "color_psychology": {
    "primary_colors": "evoke desired emotional response",
    "accent_colors": "draw attention to key elements",
    "background_colors": "vibrant themed environment for context",
    "contrast_ratios": "ensure readability and accessibility",
    "cultural_considerations": "appropriate for target demographics",
    "environmental_palette": "colors that match product context"
  },
  "typography_strategy": {
    "headline_impact": "industry-specific attractive product name",
    "subheading_support": "explanatory secondary information",
    "body_text_clarity": "readable detailed information",
    "hierarchy_establishment": "clear information priority",
    "font_personality": "category-specific typography style",
    "industry_font_match": "fonts that represent product sector"
  },
  "target_audience": {
    "demographic_alignment": "age, gender, income appropriate design",
    "psychographic_matching": "lifestyle, values, interests appeal",
    "behavioral_triggers": "purchase motivations and barriers",
    "communication_style": "language and tone preferences",
    "media_consumption": "platform and format expectations"
  },
  "technical_specifications": {
    "resolution_requirements": "optimized for delivery medium",
    "file_formats": "appropriate for print or digital use",
    "color_profiles": "correct color space for reproduction",
    "scalability": "maintains quality across size variations",
    "loading_optimization": "fast display for digital formats"
  },
  "legal_compliance": {
    "truthful_claims": "accurate product representations",
    "disclaimer_inclusion": "required legal statements",
    "accessibility_standards": "ADA compliant design elements",
    "industry_regulations": "sector-specific advertising rules",
    "copyright_respect": "original or licensed imagery and content"
  },
  "mood_and_tone": {
    "emotional_appeal": "specific feeling evocation",
    "brand_personality": "consistent character expression",
    "aspirational_quality": "desired lifestyle connection",
    "trustworthiness": "credible and reliable presentation",
    "memorability": "distinctive and unforgettable elements"
  },
  "inspiration_references": [
    "Apple's minimalist product showcases",
    "Nike's aspirational lifestyle campaigns",
    "Coca-Cola's emotional storytelling",
    "BMW's luxury positioning",
    "Dollar Shave Club's disruptive humor"
  ],
  "avoid": [
    "cluttered, overwhelming layouts",
    "misleading or exaggerated claims",
    "poor readability or contrast",
    "inconsistent brand representation",
    "generic, forgettable messaging",
    "ignoring target audience preferences"
  ],
  "enhancement_keywords": [
    "compelling",
    "persuasive",
    "professional",
    "attention-grabbing",
    "brand-focused",
    "results-driven",
    "targeted messaging",
    "conversion-optimized",
    "memorable",
    "action-oriented",
    "value-driven",
    "strategically designed"
  ]
}

IMPORTANT: 
- Return ONLY the JSON, without additional text, explanations or markdown formatting. Just the pure JSON.
- Generate the JSON output in the same language as the product description provided.`;

export async function generateAdPrompt(productData: {
  title: string;
  description: string;
  price: string;
  features?: string[];
  imageUrl?: string;
}) {
  const ai = getGeminiClient();

  // Build the user input similar to the one used with GPT-4o
  const userInput = `
Product context:
- Brand: ${productData.title.split(' ')[0] || 'Not specified'}
- Product: ${productData.title || 'Not specified'}
- Description: ${productData.description || 'Not specified'}
- Slogan: Not specified
${productData.price ? `- Price: ${productData.price} (IMPORTANT: This price MUST be included in the generated JSON, do not invent another price)` : '- Price: Not specified'}
- URL: NOT PROVIDED - FORBIDDEN to include any URL, website or domain
- Target: based on product description
${productData.imageUrl ? `- Product Image URL: ${productData.imageUrl} (IMPORTANT: This is the actual product image that MUST be used in the advertisement)` : ''}

CRITICAL REMINDERS:
1. If price was provided, it MUST appear in the JSON (in call_to_action or persuasive_elements)
2. ⚠️ NO URL = DO NOT include ANY URL, domain or website in the JSON
3. ⚠️ NEVER include phone numbers in the ad - they are FORBIDDEN
4. FORBIDDEN to invent fake contacts like "www.example.com", emails, addresses, etc.
5. Background must be contextual and vibrant EXCEPT for elegant/luxury products
6. Product name typography must be industry-specific
7. All content must be generated in the SAME LANGUAGE as the product description
8. ${productData.imageUrl ? 'The provided product image URL MUST be used to show the actual product in the ad' : 'Create a representative product visualization'}
`;

  // Retry logic for overloaded models
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      // Combine the system prompt and user input
      const fullPrompt = MASTER_PROMPT + "\n\n" + userInput;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: fullPrompt,
        config: {
          temperature: 0.8,
          responseMimeType: "application/json"
        }
      });
    
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response text from AI');
      }
      
      console.log('📋 Gemini response received, length:', text.length);
      
      // Function to clean the JSON and fix common issues
      const cleanJsonString = (jsonStr: string): string => {
        // First, try to fix nested double quotes
        // Look for patterns like: "text": "something with "quotes" inside"
        jsonStr = jsonStr.replace(/:\s*"([^"]*)"([^"]*)"([^"]*)"(?=\s*[,}])/g, (match, p1, p2, p3) => {
          // Replace internal quotes with single quotes
          return `: "${p1}'${p2}'${p3}"`;
        });
        
        // Fix more complex cases with multiple quotes
        jsonStr = jsonStr.replace(/:\s*"([^:,}]*)"([^",]*)"([^",]*)"([^",]*)"([^"]*)"(?=\s*[,}])/g, 
          `: "$1'$2'$3'$4'$5"`);
        
        // Fix cases where there are quotes followed by commas inside the string
        jsonStr = jsonStr.replace(/:\s*"([^"]*)",\s*"([^"]*)"(?=\s*[,}])/g, `: "$1, $2"`);
        
        return jsonStr;
      };
      
      // Try to parse the JSON directly
      try {
        const jsonPrompt = JSON.parse(text);
        console.log('✅ Gemini generated JSON validated successfully');
        console.log('📋 JSON structure:', Object.keys(jsonPrompt));
        return jsonPrompt;
      } catch (parseError) {
        console.error('❌ Error parsing Gemini JSON:', parseError);
        console.log('🔧 Attempting to clean JSON...');
        
        // Try to clean and parse again
        try {
          const cleanedJson = cleanJsonString(text);
          const jsonPrompt = JSON.parse(cleanedJson);
          console.log('✅ JSON cleaned and parsed successfully');
          return jsonPrompt;
        } catch (cleanError) {
          console.error('❌ Error parsing cleaned JSON:', cleanError);
          
          // Last attempt: extract JSON with regex and clean
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const cleanedMatch = cleanJsonString(jsonMatch[0]);
              return JSON.parse(cleanedMatch);
            } catch (e) {
              console.error('❌ Error in last attempt:', e);
            }
          }
        }
        
        console.error('Content received:', text);
        throw new Error("Could not generate valid JSON");
      }
    } catch (error) {
      lastError = error;
      retries--;
      console.error(`❌ Attempt failed, ${retries} retries left:`, error);
      
      if (retries > 0) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, 3 - retries) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error("❌ All retry attempts failed");
  throw lastError || new Error("Failed to generate prompt after multiple attempts");
}

export async function generateAdvertisementImage(adPrompt: AdPrompt, productImageUrl?: string) {
  console.log('📋 Advertisement specifications generated successfully');
  console.log('🎨 Creating advertisement image...');
  
  try {
    // Create a detailed prompt for image generation based on the advertisement strategy
    const imagePrompt = createImagePromptFromStrategy(adPrompt);
    console.log('🎨 Generated image prompt:', imagePrompt);
    
    // Generate image using our custom image generator
    const generatedImage = await generateImageWithCanvas(imagePrompt);
    
    console.log('✅ Advertisement image created successfully');
    return generatedImage;
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Fallback: return a better placeholder
    const fallbackImage = createBetterPlaceholder(adPrompt);
    return fallbackImage;
  }
}

function createImagePromptFromStrategy(adPrompt: AdPrompt): string {
  const { style_parameters, composition, color_psychology, typography_strategy, target_audience } = adPrompt;
  
  return `Professional advertisement for ${style_parameters.visual_hierarchy.primary_focus}:
  - Focus: ${style_parameters.visual_hierarchy.primary_focus}
  - Colors: ${color_psychology.primary_colors}
  - Background: ${composition.background_environment}
  - Style: Modern, clean, professional
  - Target: ${target_audience.demographic_alignment}`;
}

async function generateImageWithCanvas(prompt: string): Promise<string> {
  // Create an SVG-based advertisement image
  const svg = createAdvertisementSVG(prompt);
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function createAdvertisementSVG(prompt: string): string {
  return `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2d2d2d;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4ecdc4;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="600" fill="url(#bg)"/>
      
      <!-- Product showcase area -->
      <rect x="50" y="80" width="300" height="220" fill="#333" stroke="#555" stroke-width="2" rx="15"/>
      <rect x="70" y="100" width="260" height="180" fill="#444" rx="10"/>
      
      <!-- Product silhouette -->
      <ellipse cx="200" cy="190" rx="80" ry="40" fill="#666"/>
      <rect x="120" y="170" width="160" height="40" fill="#777" rx="5"/>
      
      <!-- Brand elements -->
      <rect x="60" y="310" width="280" height="3" fill="url(#accent)"/>
      
      <!-- Product name -->
      <text x="200" y="340" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="20" font-weight="bold">Air Jordan 1 Mid SE</text>
      
      <!-- Description -->
      <text x="200" y="365" text-anchor="middle" fill="#ccc" font-family="Arial, sans-serif" font-size="14">Premium Leather • Nike Air Cushioning</text>
      
      <!-- Price -->
      <text x="200" y="395" text-anchor="middle" fill="#4ecdc4" font-family="Arial, sans-serif" font-size="24" font-weight="bold">$135.80</text>
      
      <!-- CTA Button -->
      <rect x="150" y="420" width="100" height="35" fill="url(#accent)" rx="18"/>
      <text x="200" y="442" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="14" font-weight="bold">SHOP NOW</text>
      
      <!-- Decorative elements -->
      <circle cx="80" cy="150" r="3" fill="#ff6b6b" opacity="0.6"/>
      <circle cx="320" cy="170" r="2" fill="#4ecdc4" opacity="0.6"/>
      <circle cx="90" cy="250" r="2" fill="#4ecdc4" opacity="0.6"/>
      <circle cx="310" cy="240" r="3" fill="#ff6b6b" opacity="0.6"/>
      
      <!-- Bottom text -->
      <text x="200" y="500" text-anchor="middle" fill="#888" font-family="Arial, sans-serif" font-size="12">AI Generated Advertisement</text>
    </svg>
  `;
}

function createBetterPlaceholder(adPrompt: AdPrompt): string {
  return createAdvertisementSVG('fallback');
}

export async function generateVideoScript(productData: {
  title: string;
  description: string;
  price: string;
  features?: string[];
  imageUrl?: string;
}, tone: 'professional' | 'casual' | 'energetic' | 'friendly' = 'energetic', duration: number = 15, focusPoints?: string[]): Promise<VideoScript> {
  const ai = getGeminiClient();

  const videoPrompt = `You are an expert video script writer for product advertising videos. Your task is to create an engaging video script for a product demonstration video that will feature the SPECIFIC PRODUCT shown in the provided product image.

CRITICAL: This script is for a video that will use the EXACT product shown in the provided product image. The presenter will interact with, hold, and demonstrate this specific product.

Product Information:
- Product Name: ${productData.title}
- Description: ${productData.description}
- Price: ${productData.price}
${productData.features && productData.features.length > 0 ? `- Features: ${productData.features.join(', ')}` : ''}
${focusPoints && focusPoints.length > 0 ? `- Focus Points: ${focusPoints.join(', ')}` : ''}
${productData.imageUrl ? `- Product Image Available: YES (The presenter will interact with this exact product shown in the image)` : '- Product Image Available: NO'}

Video Requirements:
- Duration: ${duration} seconds
- Tone: ${tone}
- Format: Product demonstration with avatar presenter using the ACTUAL PRODUCT
- Visual: Presenter will hold, point to, and interact with the specific product from the image

Instructions:
1. Create a compelling introduction that grabs attention and mentions the SPECIFIC product by name
2. Generate 3-5 key product highlights that can be PHYSICALLY demonstrated with the actual product
3. Include references to product interactions (e.g., "As you can see here", "Notice this feature", "Let me show you")
4. Write dialogue that assumes the presenter is holding/showing the actual product
5. Include a strong call to action that motivates immediate purchase
6. The script should be natural for a human presenter to say while handling the product
7. Keep it conversational and engaging, matching the specified tone
8. Include the product price if provided
9. Make sure the content fits within the specified duration
10. IMPORTANT: Write as if the presenter is physically demonstrating the actual product shown in the image

Return ONLY a JSON object with this exact structure:
{
  "introduction": "Opening hook that grabs attention and introduces the product",
  "productHighlights": [
    "First key benefit or feature to highlight",
    "Second key benefit or feature to highlight",
    "Third key benefit or feature to highlight"
  ],
  "callToAction": "Compelling closing that motivates action",
  "tone": "${tone}",
  "duration": ${duration}
}

IMPORTANT:
- Return ONLY the JSON, no additional text or formatting
- Each section should be written as natural speech for the presenter
- Product highlights should be specific to the product, not generic
- Include the price naturally in the script if provided`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro-latest",
      contents: videoPrompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json"
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response text from AI');
    }

    console.log('📋 Video script response received, length:', text.length);

    try {
      const scriptData = JSON.parse(text);
      console.log('✅ Video script JSON validated successfully');
      return scriptData as VideoScript;
    } catch (parseError) {
      console.error('❌ Error parsing video script JSON:', parseError);
      console.error('Content received:', text);
      throw new Error("Could not generate valid video script JSON");
    }
  } catch (error) {
    console.error("Error generating video script with Gemini:", error);
    throw error;
  }
}

export async function testGeminiConnection() {
  const ai = getGeminiClient();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro-latest",
      contents: "Say 'Connection successful' if you can receive this message"
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response text from AI');
    }
    return text.includes("Connection successful");
  } catch (error) {
    console.error("Error testing connection with Gemini:", error);
    return false;
  }
}