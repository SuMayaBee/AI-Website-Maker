from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="AI Website Builder Backend", version="1.0.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini models with different configurations
model = genai.GenerativeModel("gemini-2.0-flash-exp")

# Generation configs
CHAT_CONFIG = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}

CODE_GENERATION_CONFIG = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 10192,
}

ENHANCE_PROMPT_CONFIG = {
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 1000,
}

# Pydantic models for request/response
class ChatRequest(BaseModel):
    prompt: str

class ChatResponse(BaseModel):
    result: str

class EnhancePromptRequest(BaseModel):
    prompt: str

class EnhancePromptResponse(BaseModel):
    enhancedPrompt: str

class CodeGenerationRequest(BaseModel):
    prompt: str

@app.get("/")
async def root():
    return {"message": "AI Website Builder FastAPI Backend"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
# Prompt templates (from data/Prompt.jsx)
CHAT_PROMPT = """
You are an AI Assistant and experienced in React Development.
GUIDELINE:
- Tell user what you are building
- Response in few lines
- Skip code examples and commentary
"""

CODE_GEN_PROMPT = """
Generate a fully structured React project using Vite.  
Ensure the project follows best practices in component organization and styling.  

**Project Requirements:**  
- Use **React** as the framework.  
- Add as many functional features as possible.  
- **Do not create an App.jsx file. Use App.js instead** and modify it accordingly.  
- Use **Tailwind CSS** for styling and create a modern, visually appealing UI.  
- Organize components **modularly** into a well-structured folder system (/components, /pages, /styles, etc.).  
- Include reusable components like **buttons, cards, and forms** where applicable.  
- Use **lucide-react** icons if needed for UI enhancement.  
- Do not create a src folder.

**Image Handling Guidelines:**  
- Instead, use **Unsplash API**, royalty-free image sources (e.g., Pexels, Pixabay).
- Do not use images from unsplash.com.
- use images from the internet.

**Dependencies to Use:**  
- "postcss": "^8"  
- "tailwindcss": "^3.4.1"  
- "autoprefixer": "^10.0.0"  
- "uuid4": "^2.0.3"  
- "tailwind-merge": "^2.4.0"  
- "tailwindcss-animate": "^1.0.7"  
- "lucide-react": "latest"  
- "react-router-dom": "latest"  
- "firebase": "^11.1.0"  
- "@google/generative-ai": "^0.21.0"  
- "@headlessui/react": "^1.7.17"  
- "framer-motion": "^10.0.0"  
- "react-icons": "^5.0.0"  
- "uuid": "^11.1.0"  
- "@mui/material": "^6.4.6"  

Return the response in JSON format with the following schema:
{
  "projectTitle": "",
  "explanation": "",
  "files": {
    "/App.js": {
      "code": ""
    },
    ...
  },
  "generatedFiles": []
}

Generate a programming code structure for a React project using Vite.
Do not create a App.jsx file. There is a App.js file in the project structure, rewrite it.
Use Tailwind css for styling. Create a well Designed UI. 

Ensure the files field contains all the created files, and the generatedFiles field contains the list of generated files.

Also update the Package.json file with the needed dependencies.

Additionally, include an explanation of the project's structure, purpose, and additional instructions:
- For placeholder images use appropriate URLs.
- Add external images if needed.
- The lucide-react library is also available to be imported IF NECESSARY.
- Update the package.json file with the required dependencies.
- Do not use backend or database related.
"""

ENHANCE_PROMPT_RULES = """
You are a prompt enhancement expert and website designer(React + vite). Your task is to improve the given user prompt by:
1. Making it more specific and detailed but..
2. Including clear requirements and constraints
3. Maintaining the original intent of the prompt
4. Using clear and precise language
5. Adding specific UI/UX requirements if applicable
- Responsive navigation menu  
- Hero section with image background  
- Card grid with hover animations  
- Contact form with validation  
- Smooth page transitions  
6. Dont use the backend or database related.
7. Keep it less than 300 words

Return only the enhanced prompt as plain text without any JSON formatting or additional explanations.
"""

@app.post("/api/ai-chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest):
    """General AI chat functionality - processes user prompts through Gemini AI"""
    try:
        # Create model with generation config
        chat_model = genai.GenerativeModel(
            "gemini-2.0-flash-exp",
            generation_config=genai.GenerationConfig(**CHAT_CONFIG)
        )
        
        # Combine the user prompt with the chat prompt template
        full_prompt = request.prompt + " " + CHAT_PROMPT
        response = chat_model.generate_content(full_prompt)
        ai_response = response.text
        
        return ChatResponse(result=ai_response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")

@app.post("/api/enhance-prompt", response_model=EnhancePromptResponse)
async def enhance_prompt(request: EnhancePromptRequest):
    """Prompt enhancement - takes user input and enhances it using predefined rules"""
    try:
        # Create model with generation config
        enhance_model = genai.GenerativeModel(
            "gemini-2.0-flash-exp",
            generation_config=genai.GenerationConfig(**ENHANCE_PROMPT_CONFIG)
        )
        
        enhanced_prompt_request = f"{ENHANCE_PROMPT_RULES}\n\nOriginal prompt: {request.prompt}"
        response = enhance_model.generate_content(enhanced_prompt_request)
        enhanced_text = response.text.strip()
        
        return EnhancePromptResponse(enhancedPrompt=enhanced_text)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt enhancement error: {str(e)}")

@app.post("/api/gen-ai-code")
async def generate_ai_code(request: CodeGenerationRequest):
    """Code generation - converts prompts to React code with structured JSON output"""
    try:
        # Create model with generation config for JSON output
        code_model = genai.GenerativeModel(
            "gemini-2.0-flash-exp",
            generation_config=genai.GenerationConfig(**CODE_GENERATION_CONFIG)
        )
        
        # Combine the user prompt with the code generation prompt template
        full_prompt = request.prompt + " " + CODE_GEN_PROMPT + "\n\nIMPORTANT: Return ONLY valid JSON format as specified in the schema above."
        response = code_model.generate_content(full_prompt)
        ai_response = response.text
        
        # Clean the response to extract JSON
        cleaned_response = ai_response.strip()
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        # Parse JSON response
        try:
            json_response = json.loads(cleaned_response)
            return json_response
        except json.JSONDecodeError:
            # If JSON parsing fails, return a structured error
            return {
                "error": "Failed to parse AI response as JSON",
                "raw_response": ai_response,
                "cleaned_response": cleaned_response
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)