# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OneClick is a Next.js 15 application that generates professional advertising images and videos using Google's Gemini AI and Fal.ai. The application is built for the MCP Hackathon, demonstrating AI agents for automated advertisement creation.

## Key Features

- URL scraping with Apify for Amazon products (optional)
- Manual product data entry
- AI-powered ad generation using Gemini 2.5 Flash for prompts and image generation
- **NEW**: AI-powered video generation using Fal.ai Veo3 with avatar presenters
- **NEW**: Video script generation using Gemini AI
- **NEW**: Avatar selection system with multiple presenter options
- Image editing capabilities (text removal, variations)
- Logo integration
- Modern UI with shadcn/ui and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **AI Integration**: Amazon Bedrock(@google/genai), Fal.ai for video generation
- **Video Generation**: Fal.ai Veo3 for image-to-video, Nano Banana for image enhancement
- **Web Scraping**: Apify Client for Amazon products (Firecrawl deprecated)
- **Forms**: React Hook Form + Zod
- **Image Processing**: Sharp, Fabric.js

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Project Structure

```
/app
  /api
    /generate-ad           # Generates ads with Gemini
    /generate-video        # Generates videos with Fal.ai Veo3
    /generate-video-script # Generates video scripts with Gemini
    /scrape-product        # Extracts data with Apify
    /edit-image            # Edit existing images
    /remove-text           # Remove text from images
    /create-variation      # Create variations of ads
  layout.tsx
  page.tsx                # Main page with video/image toggle
/components
  /ui                    # shadcn/ui components
  /magicui               # Custom UI effects
  GeneratedAd.tsx        # Displays generated ad
  VideoGenerator.tsx     # Video generation orchestrator
  VideoPreview.tsx       # Video playback and controls
  AvatarSelector.tsx     # Avatar selection modal
  ProductForm.tsx        # Manual form
  UrlInput.tsx           # URL input
  LogoEditor.tsx         # Logo editing
/lib
  firecrawl.ts          # Firecrawl client (deprecated)
  gemini.ts             # Gemini AI client (ads + video scripts)
  fal.ts                # Fal.ai client for video generation
  image-utils.ts        # Image processing
  types.ts              # TypeScript types (includes video types)
  utils.ts              # Utilities
```

## Environment Variables

Required in `.env.local`:

- `GEMINI_API_KEY`: Google Gemini API key (required for ad generation and video scripts)
- `APIFY_TOKEN`: Apify API token (required for Amazon product scraping)
- `FAL_KEY`: Fal.ai API key (required for video generation with Veo3 and image enhancement)
- `FIRECRAWL_API_KEY`: Firecrawl API key (deprecated - no longer used)

## AI Architecture & Flow

### Image Ad Generation Pipeline

1. **Data Source Selection**:

   - URL scraping via Apify (Amazon products) → structured product data
   - Manual form entry → structured product data

2. **Prompt Generation** (`lib/gemini.ts:generateAdPrompt`):

   - Input: Product data (title, description, price, features, imageUrl)
   - AI Model: Gemini 1.5 Flash
   - Output: Structured JSON prompt with advertising specifications
   - Complex master prompt system with industry-specific rules for backgrounds, typography, and layouts

3. **Image Generation** (`lib/gemini.ts:generateAdvertisementImage`):
   - Input: JSON prompt + product image URL (required)
   - AI Model: Gemini 1.5 Flash for image generation
   - Process: Fetches and validates product image, sends to Gemini with structured prompt
   - Output: Base64 encoded advertisement image

### Video Generation Pipeline

1. **Script Generation** (`lib/gemini.ts:generateVideoScript`):
   - Input: Product data (title, description, price, features)
   - AI Model: Gemini 2.5 Flash
   - Output: Structured video script with introduction, highlights, and call-to-action
   - Configurable tone (professional, casual, energetic, friendly)

2. **Avatar Selection**:
   - User selects from predefined avatar personas
   - Each avatar has specific characteristics (gender, style, description)
   - Smart Match option for AI-powered avatar selection

3. **Video Generation** (`lib/fal.ts:generateVideoWithVeo3`):
   - Input: Product image + video script + avatar configuration
   - Optional: Image enhancement using Nano Banana
   - AI Model: Fal.ai Veo3 for image-to-video generation
   - Output: Professional product demonstration video (MP4)

### Key API Routes

**Image Generation:**
- **POST /api/scrape-product**: Uses Apify's Amazon scraper to extract product data from URLs
- **POST /api/generate-ad**: Orchestrates the two-step AI pipeline (prompt → image)
- **POST /api/edit-image**: Modifies existing generated images
- **POST /api/remove-text**: Removes text from images using image processing
- **POST /api/create-variation**: Creates variations of existing ads

**Video Generation:**
- **POST /api/generate-video-script**: Generates engaging video scripts using Gemini
- **POST /api/generate-video**: Creates videos using Fal.ai Veo3 with avatar presenters

## Critical Implementation Details

### Gemini Integration Patterns

- Uses `@google/genai` package for all AI interactions
- Prompt generation uses structured JSON output with `responseMimeType: "application/json"`
- Image generation requires actual product images - will not generate misleading ads without them
- Video script generation creates natural, conversational content for presenters
- Error handling specifically catches Gemini API key, quota, and image-related errors

### Fal.ai Integration Patterns

- Uses `@fal-ai/client` package for video generation and image enhancement
- Veo3 model for high-quality image-to-video transformation
- Nano Banana model for product image enhancement before video generation
- Queue-based processing with real-time status updates
- Comprehensive error handling for API limits and processing failures

### Type Safety & Validation

- All API inputs/outputs are validated with Zod schemas
- `AmazonProductSchema` handles complex Amazon product data structure
- `ProductDataSchema` for manual form data
- **NEW**: `VideoGenerationRequestSchema` for video creation requests
- **NEW**: `VideoScriptSchema` for structured script validation
- **NEW**: `VideoAvatarSchema` for avatar configuration
- **NEW**: `VideoConfigurationSchema` for video settings (resolution, duration, aspect ratio)
- Type transformation between Amazon format and internal ProductData format

### Image Processing Architecture

- Sharp for server-side image optimization
- Fabric.js for client-side image editing
- Base64 encoding for image transfer between AI and frontend
- Image validation and processing in `lib/image-utils.ts`

### Video Processing Architecture

- Fal.ai Veo3 for professional video generation (720p/1080p, 8-second duration)
- Real-time progress tracking with multi-step processing visualization
- Video player with custom controls (play/pause, progress, download)
- MP4 format with optional audio generation
- Video URL hosting through Fal.ai's CDN

## Configuration Files

- **next.config.ts**: Security headers, image optimization, standalone output for Docker
- **eslint.config.mjs**: ESLint configuration with Next.js and TypeScript rules
- **tsconfig.json**: TypeScript config with absolute imports (`@/` prefix)
- **components.json**: shadcn/ui configuration

## Testing

No specific test framework is currently configured. To add tests:

1. Install testing dependencies (Jest, React Testing Library, etc.)
2. Create test files alongside components
3. Add test scripts to package.json

## Build & Deploy Notes

- The project uses Next.js Turbopack for faster builds in both dev and production
- Configured for Vercel deployment (see vercel.json)
- Uses Node.js 20+ runtime
- Standalone output configured for Docker deployment
- Maximum function duration set to 300 seconds for API routes

## Common Development Patterns

1. **Error Handling**: API routes have comprehensive error handling with user-friendly Spanish messages
2. **Absolute Imports**: Use `@/` prefix for imports from root directory
3. **Type Safety**: All external data is validated with Zod before processing
4. **AI Integration**: Always check for API keys before making AI calls
5. **Image Requirements**: Product images are mandatory for ad generation to avoid misrepresentation

## Security Considerations

- API keys stored in environment variables only
- No user data persistence - stateless application
- Input validation with Zod on all API routes
- Security headers configured in next.config.ts
- CORS configured appropriately for API routes
- Contact information generation is strictly forbidden in AI prompts to prevent hallucination

## Important Notes for AI Assistants

- The app is primarily in Spanish for user-facing content but code/comments are in English
- Always check existing patterns in `/lib` and `/components` before creating new utilities
- Use the existing type system extensively - don't bypass Zod validation
- Follow the established error handling patterns in API routes
- The Gemini integration has complex prompt engineering - understand the master prompt system before modifying
- Firecrawl integration is deprecated - all URL scraping now uses Apify
- Product images are required for ad generation - this is a business rule, not just a technical limitation
