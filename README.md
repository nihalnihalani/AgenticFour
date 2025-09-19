# OneClick - Professional Ad Generator

A Next.js application that creates professional advertising images using Google's Gemini AI. Built for the MCP Hackathon, OneClick uses AI agents to automatically generate compelling advertisements from product data.

## Features

- 🔗 **Smart URL Processing**: Automatically extracts product information from Amazon URLs using Apify
- ✏️ **Manual Entry**: Complete form for manual product data input when URLs aren't available
- 🤖 **AI-Powered Generation**: Uses Gemini 2.5 Flash for intelligent prompt creation and image generation
- 🎨 **Professional Design**: Modern interface built with shadcn/ui and Tailwind CSS
- 💾 **Export & Share**: Download or share generated advertisements instantly
- 🔄 **Image Editing**: Edit, create variations, and remove text from generated ads

## Technologies

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui Components
- Amazon Bedrock(@google/genai)
- Apify Client for product scraping
- React Hook Form + Zod validation

## Getting Started

### 1. Clone the repository

```bash
git clone [your-repository-url]
cd OneClick-ad-generator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

### 4. Add your API keys to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
APFIY_TOKEN=your_apify_token_here
```

## How to Get API Keys

### Google Gemini API Key (Required)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API Key
4. Copy and paste it into `.env.local`

### Apify Token (Required for URL scraping)

1. Go to [Apify Console](https://console.apify.com/)
2. Create a free account
3. Navigate to Settings > Integrations
4. Copy your API token and paste it into `.env.local`

_Note: If you don't have Apify, the app will work with manual form entry only_

## Usage

### 1. Start the development server

```bash
npm run dev
```

### 2. Open your browser

Navigate to [http://localhost:3000](http://localhost:3000)

### 3. Generate ads using either method:

- **Product URL**: Paste any Amazon product URL for automatic data extraction
- **Manual Entry**: Fill in the product information form manually

### 4. AI Magic

OneClick will:

- Generate an intelligent advertising prompt using Gemini 2.5 Flash
- Create a professional advertisement image
- Provide editing tools for customization

### 5. Export your ad

- Download the generated image
- Share it directly
- Create variations with different styles

## Project Structure

```
/app
  /api
    /generate-ad      # Main ad generation endpoint
    /scrape-product   # Apify product extraction
    /edit-image       # Image editing capabilities
    /remove-text      # Text removal from images
    /create-variation # Generate ad variations
  layout.tsx
  page.tsx           # Main application page
/components
  /ui               # shadcn/ui component library
  /magicui          # Custom animated components
  GeneratedAd.tsx   # Ad display and interaction
  ProductForm.tsx   # Manual product data form
  UrlInput.tsx      # URL processing interface
/lib
  gemini.ts        # Amazon Bedrockintegration
  image-utils.ts   # Image processing utilities
  types.ts         # TypeScript type definitions
```

## AI Architecture

OneClick uses a sophisticated two-step AI process:

1. **Intelligent Prompt Generation**: Gemini 2.5 Flash analyzes product data and creates structured advertising specifications with industry-specific design rules
2. **Professional Image Creation**: The generated prompt is used to create high-quality advertisement images that match the product's market category

## Development Commands

```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Code linting
npm run lint
```

## Built for MCP Hackathon

OneClick demonstrates the power of AI agents in creative workflows, automatically generating professional advertisements that would typically require design expertise. The application showcases intelligent prompt engineering and multi-model AI coordination.

## Demo

This application is designed as a demonstration of AI-powered creative tools. It requires no user authentication and focuses on showcasing Gemini AI's advertisement generation capabilities.

## License

MIT License
