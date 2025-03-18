# Text Flow Backend API

This is the backend service for Text Flow, a typing practice application. It provides smart quote extraction from various sources using LLMs through Together.ai.

## Features

- Extract quotes from raw text
- Process and extract quotes from documents (PDF, DOCX, TXT)
- Extract quotes from URLs
- Subscription tiers (Free and Pro)
- Usage quota management
- Fallback models for reliability

## Getting Started

### Prerequisites

- Node.js 16+
- Together.ai API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Set up your environment variables by copying the `.env.example` to `.env` and filling in your API keys:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

### Development

Start the development server:

```bash
npm run dev
```

The server will start on http://localhost:3001

### Production Build

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## API Endpoints

### Quote Extraction

- `POST /api/extract-quotes` - Extract quotes from raw text
- `POST /api/process-document` - Extract quotes from documents
- `POST /api/process-url` - Extract quotes from a URL

### Subscription and Quota

- `GET /api/quota` - Get current quota status
- `POST /api/subscription` - Update subscription tier

## Subscription Tiers

### Free Tier
- 100 quotes per month
- Basic models
- Text only

### Pro Tier ($5/month)
- Unlimited quotes
- Premium models
- Document support (PDF, DOCX, TXT)
- URL processing

## Technologies Used

- Express.js - Web framework
- LiteLLM - LLM integration
- Mammoth - DOCX processing
- pdf-parse - PDF processing
- loguru - Logging 