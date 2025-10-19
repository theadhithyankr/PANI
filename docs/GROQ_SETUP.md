# Groq AI Integration Setup

## Overview
This application integrates with Groq AI to provide intelligent chat functionality with fast inference speeds. The system provides different AI assistants based on user type:

- **For Employers**: Expert recruitment and talent acquisition assistant
- **For Candidates**: Career coach and job search assistant

## Setup Instructions

### 1. Get Groq API Key
1. Visit [Groq Console](https://console.groq.com)
2. Sign up for an account
3. Go to [API Keys](https://console.groq.com/keys)
4. Create a new API key

### 2. Configure Environment Variables
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Groq API key to the `.env` file:
   ```
   VITE_GROQ_API_KEY=your_actual_api_key_here
   ```

### 3. Restart Development Server
After adding the API key, restart your development server:
```bash
npm run dev
```

## Features

### Supported File Types
- **Text**: All text-based conversations and prompts
- **Note**: Groq currently focuses on text-based AI interactions with fast inference speeds

### AI Models
The integration uses Llama 3.3 70B Versatile by default, providing:
- High-quality responses with fast inference
- Context-aware conversations based on user type
- Efficient token usage
- Low latency responses

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
- Users can retry after fixing issues
- API key validation with clear setup instructions

## Cost Considerations
- **Text processing**: Charged per token (input + output)
- **Fast inference**: Groq provides high-speed responses at competitive rates
- **Efficient models**: Optimized for performance and cost

## Troubleshooting

### Common Issues
1. **"API key not found" error**: Make sure you've set `VITE_GROQ_API_KEY` in your `.env` file
2. **Connection errors**: Check your internet connection and API key validity
3. **Rate limits**: Groq has rate limits - wait a moment before retrying

### Support
- Groq Documentation: https://console.groq.com/docs
- Groq Console: https://console.groq.com