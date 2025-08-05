# AI Website Builder - FastAPI Backend

This is the FastAPI backend for the AI Website Builder project. It provides three main API endpoints that handle AI interactions using Google's Gemini AI model.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Google Gemini API key

### Installation & Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   - Copy your Gemini API key to the `.env` file (already configured)
   - Or export it manually:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

5. **Start the server:**
   ```bash
   # Using the startup script (recommended)
   ./start.sh
   
   # Or manually
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

The server will start on `http://localhost:8000`

## 📚 API Documentation

Once the server is running, you can access:
- **Interactive API docs:** http://localhost:8000/docs
- **Alternative docs:** http://localhost:8000/redoc
- **Health check:** http://localhost:8000/health

## 🔌 API Endpoints

### 1. `/api/ai-chat` (POST)
General AI chat functionality for conversational interactions.

**Request:**
```json
{
  "prompt": "Your message here"
}
```

**Response:**
```json
{
  "result": "AI response"
}
```

### 2. `/api/enhance-prompt` (POST)
Enhances user prompts to make them more effective for code generation.

**Request:**
```json
{
  "prompt": "Basic prompt to enhance"
}
```

**Response:**
```json
{
  "enhancedPrompt": "Enhanced and detailed prompt"
}
```

### 3. `/api/gen-ai-code` (POST)
Generates React code based on user prompts.

**Request:**
```json
{
  "prompt": "Create a todo app"
}
```

**Response:**
```json
{
  "projectTitle": "React To-Do App",
  "explanation": "Project description...",
  "files": {
    "/App.js": {
      "code": "React component code..."
    }
  },
  "generatedFiles": ["/App.js", "/components/TodoList.js"]
}
```

## 🔧 Configuration

The backend uses different AI configurations for different endpoints:

- **Chat Config:** Higher creativity (temperature: 1.0)
- **Code Generation:** Structured output with JSON format
- **Prompt Enhancement:** More focused responses (temperature: 0.7)

## 🌐 CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Next.js frontend)

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── .env                # Environment variables
├── start.sh            # Startup script
└── README.md           # This file
```

## 🔍 Testing

You can test the API endpoints using:

1. **FastAPI Interactive Docs:** http://localhost:8000/docs
2. **curl commands:**
   ```bash
   # Health check
   curl http://localhost:8000/health
   
   # AI Chat
   curl -X POST "http://localhost:8000/api/ai-chat" \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Hello, how are you?"}'
   ```

## 🚨 Troubleshooting

### Common Issues:

1. **"GEMINI_API_KEY environment variable is required"**
   - Make sure your `.env` file contains the API key
   - Or export it: `export GEMINI_API_KEY=your_key`

2. **CORS errors from frontend**
   - Ensure the backend is running on port 8000
   - Check that the frontend is running on port 3000

3. **Module not found errors**
   - Make sure you're in the virtual environment
   - Run `pip install -r requirements.txt` again

4. **Port already in use**
   - Kill the process using port 8000: `lsof -ti:8000 | xargs kill -9`
   - Or use a different port: `uvicorn main:app --port 8001`

## 🔄 Integration with Frontend

The frontend has been updated to use this FastAPI backend instead of the Next.js API routes. The integration is handled through:

- `lib/fastapi-client.js` - API client utility
- Updated components: `ChatView.jsx`, `Hero.jsx`, `CodeView.jsx`

Make sure both the FastAPI backend (port 8000) and Next.js frontend (port 3000) are running simultaneously.