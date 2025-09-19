import { GoogleGenAI } from "@google/genai";
import type { Part } from "@google/genai";
import type { AdPrompt } from "./types";
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

  try {
    // Combine the system prompt and user input
    const fullPrompt = MASTER_PROMPT + "\n\n" + userInput;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    console.error("Error generating prompt with Gemini:", error);
    throw error;
  }
}

export async function generateAdvertisementImage(adPrompt: AdPrompt, productImageUrl?: string) {
  const ai = getGeminiClient();

  // Convert the complete JSON to string as done with nano-banana
  const jsonPromptString = JSON.stringify(adPrompt);
  console.log('📏 JSON length for image:', jsonPromptString.length);
  console.log('🔍 First 500 characters:', jsonPromptString.substring(0, 500) + '...');
  
  let contents: Part[];
  
  if (productImageUrl) {
    try {
      // Fetch and process the product image
      console.log('📥 Fetching product image from:', productImageUrl);
      const processedImage = await fetchAndProcessImage(productImageUrl);
      
      console.log('✅ Product image processed, format:', processedImage.mimeType);
      
      // Create prompt with image as per documentation
      contents = [
        { 
          text: `Generate a professional advertisement image based on this JSON specification: ${jsonPromptString}
          
CRITICAL INSTRUCTION: Use the provided product image as the central element of the advertisement. The product in the generated ad MUST be exactly the same as shown in the provided image. Do not create a different product.` 
        },
        {
          inlineData: {
            mimeType: processedImage.mimeType,
            data: processedImage.base64,
          },
        },
      ];
    } catch (error) {
      console.error('⚠️ Error fetching product image:', error);
      // Don't generate ad without product image - it would be misleading
      throw new Error(`Failed to fetch product image. Ad generation requires the actual product image to avoid misrepresentation. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // No product image provided - don't generate misleading ad
    throw new Error('Product image is required to generate the ad. Please provide a valid image URL.');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: contents,
    });

    // The response should include the generated image
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log('✅ Image generated successfully by Gemini');
          return part.inlineData.data;
        }
      }
    }
    throw new Error("Could not generate image");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function testGeminiConnection() {
  const ai = getGeminiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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