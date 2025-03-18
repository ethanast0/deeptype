# TextFlow - Smart Typing Practice

TextFlow is a modern typing practice application that uses AI to extract quotes from various sources including text, documents (PDF, DOCX, TXT), and websites. It offers a clean, minimalist interface for an optimal typing experience.

## Features

- Smart quote extraction using Together.ai's LLMs
- Support for text, PDFs, DOCXs, and URLs
- Subscription-based model with free and pro tiers
- Clean, modern UI with a minimalist bottom menu
- Stats tracking for WPM, accuracy, and time
- Easy quote navigation

## Project Structure

The project consists of two main parts:

1. **Frontend** - React/TypeScript application with Shadcn UI components
2. **Backend** - Express.js API for quote extraction and document processing

## Getting Started

### Prerequisites

- Node.js 16+
- Together.ai API key (for backend)

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` and add your Together.ai API key:
   ```
   TOGETHER_API_KEY=your_api_key_here
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. From the project root, install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:8080`

## Usage

### Upload JSON

Click the file-json icon to upload a JSON file containing an array of quotes.

### Smart Document Upload (Pro)

Click the file-input icon to upload PDF, DOCX, or TXT files. The application will extract meaningful quotes from these documents.

### Paste URL (Pro)

Copy a URL to your clipboard and click the link icon. The application will fetch the content and extract quotes from the webpage.

### Subscription Tiers

- **Free Plan**: 100 quotes per month, basic extraction, text uploads only
- **Pro Plan**: Unlimited quotes, premium extraction models, support for documents and URLs

## Security and Confidentiality

This project follows security best practices:

- All API keys and sensitive information are stored in `.env` files
- All `.env` files are listed in `.gitignore` to prevent accidental commits
- User API keys are stored only in browser's local storage, never on the server
- Requests to external APIs like Together.ai are made server-side to protect API keys
- No sensitive user data is logged or stored permanently
- Rate limiting is implemented to prevent abuse
- Document processing is done securely and files are not stored after processing

### For Contributors

When working with this project:
- Never commit `.env` files or API keys
- Use the provided `.env.example` as a template
- Ensure any new sensitive configuration is added to `.gitignore`
- All API keys in documentation or examples should be clearly marked as placeholders

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Shadcn UI
- Tailwind CSS

### Backend
- Express.js
- LiteLLM (Together.ai integration)
- pdf-parse & mammoth (document processing)
- loguru (logging)

## License

MIT

## Acknowledgments

- Together.ai for providing the LLM API
- Shadcn for the beautiful UI components
- Tailwind CSS for styling
