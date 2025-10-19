# OpenRouter AI Integration Setup

## Overview
This application integrates with OpenRouter AI to provide intelligent chat functionality with support for text, images, and PDFs. The system provides different AI assistants based on user type:

- **For Employers**: Expert recruitment and talent acquisition assistant
- **For Candidates**: Career coach and job search assistant

## Setup Instructions

### 1. Get OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up for an account
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key

### 2. Configure Environment Variables
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenRouter API key to the `.env` file:
   ```
   VITE_OPENROUTER_API_KEY=your_actual_api_key_here
   ```

### 3. Restart Development Server
After adding the API key, restart your development server:
```bash
npm run dev
```

## Features

### Supported File Types
- **Images**: PNG, JPEG, WebP
- **PDFs**: All PDF documents
  - Selectable-text PDFs parsed via text engine
  - Scanned/image-only PDFs parsed via OCR engine (automatic)
- **Documents**: DOC, DOCX, TXT, CSV, XLSX, XLS

### AI Models
The integration uses Claude 3.5 Sonnet by default, providing:
- High-quality responses
- Image analysis capabilities
- PDF content extraction and analysis
- Context-aware conversations based on user type

### System Prompts
The AI assistant adapts its responses based on the user type:

#### For Employers
- Job description creation
- Candidate evaluation
- Interview preparation
- Market insights and compensation advice
- Resume/CV analysis with hiring recommendations

#### For Candidates
- Career guidance and development
- Resume optimization
- Job search strategies
- Interview preparation
- Salary negotiation advice
- Professional networking tips

## Error Handling
The application includes comprehensive error handling:
- Connection errors are displayed to users
- Failed requests show helpful error messages
- For scanned PDFs: we first attempt OCR; if OCR and text parsing both fail (e.g., due to extremely low scan quality), the UI surfaces a clear message recommending a clearer scan or uploading page images (PNG/JPG).
- Users can retry after fixing issues
- API key validation with clear setup instructions

## Cost Considerations
- **Text processing**: Charged per token (input + output)
- **Images**: Included in token count
- **PDFs**: Free text extraction using `pdf-text` engine
- **Advanced OCR**: Available via `mistral-ocr` engine (additional cost)

## Troubleshooting

### Common Issues
1. **"API key not found" error**: Make sure you've set `VITE_OPENROUTER_API_KEY` in your `.env` file
2. **Connection errors**: Check your internet connection and API key validity
3. **File upload issues**: Ensure file types are supported (see list above)
4. **Large files**: PDFs and images have size limits - try smaller files if uploads fail

### Support
- OpenRouter Documentation: https://openrouter.ai/docs
- API Status: https://status.openrouter.ai/ 