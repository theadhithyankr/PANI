# AI Job Creation Setup

## Overview
The CreateJobPage now includes an AI assistant that helps employers create comprehensive job postings through natural conversation. The AI uses OpenRouter's API with structured outputs to generate job data.

## Features
- **Incremental Updates**: Form fields update immediately as you provide any job information
- **Real-time Form Population**: AI extracts and applies job details from every message
- **Conversational AI**: Chat naturally about your job requirements
- **Context Awareness**: AI considers existing form data when making suggestions
- **Bilingual Support**: AI can communicate in German or English
- **Progressive Enhancement**: Start with basic info and add details through conversation
- **Visual Feedback**: Notifications show when AI updates the form

## Setup

### 1. OpenRouter API Key
Add your OpenRouter API key to your environment variables:

```bash
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

You can get an API key from [OpenRouter](https://openrouter.ai/).

### 2. Supported Models
The AI uses GPT-4o for structured outputs. This model supports:
- JSON Schema validation
- Structured outputs
- Reliable parsing
- High-quality responses

### 3. How It Works
1. **Start Simple**: Just mention a job title like "I need a Frontend Developer"
2. **Immediate Updates**: Watch the form populate with basic information instantly
3. **Add Details Progressively**: Continue chatting to add more specifics:
   - "Make it a senior position in Berlin"
   - "It's urgent, high priority"  
   - "Part-time, React experience required"
4. **Real-time Form Updates**: Every message can update relevant form fields
5. **Manual Override**: Edit any field manually - the AI considers your changes

## Example Prompts

### Start Simple (Updates Title & Basic Info)
- "I need a Frontend Developer"
- "Software Engineer position"
- "Marketing Manager role"

### Add Context (Updates Multiple Fields)
- "Senior Frontend Developer in Berlin" → Updates title, experience level, location
- "Urgent: Backend Engineer" → Updates title, priority
- "Part-time React developer" → Updates title, job type, skills

### Progressive Refinement
- "Make it remote work" → Updates remote setting
- "Add TypeScript to requirements" → Updates skills
- "Salary range 60k-80k EUR" → Updates compensation

## Technical Details

### AI Hook: `useJobCreationAI`
Located in `src/hooks/employer/useJobCreationAI.js`

**Key Features:**
- Structured outputs using OpenRouter's JSON Schema support
- Context passing (current form data)
- Conversation management
- Error handling
- Streaming support

**API Model:** `openai/gpt-4o`

### JSON Schema
The AI always responds with:
```json
{
  "message": "Conversational response to user",
  "data": {
    // Any job fields extracted from the conversation
    // Only includes fields where information was provided
    "title": "Software Developer", 
    "priority": "high",
    "location": "Berlin"
    // ... other fields as available
  }
}
```

### Form Integration
- **Real-time Updates**: Form fields update immediately when AI extracts any job information
- **Incremental Population**: No need to wait for complete job data - fields update progressively
- **Context Awareness**: Existing form data is sent as context to the AI  
- **Hybrid Approach**: Users can mix manual entry with AI assistance
- **Visual Feedback**: Notifications show when AI updates the form

## Error Handling
- API key validation
- Model availability checks
- Graceful fallbacks for parsing errors
- User-friendly error messages

## Cost Considerations
- Uses structured outputs (may have different pricing)
- Sends form context with each request
- Consider implementing request limits for production use 