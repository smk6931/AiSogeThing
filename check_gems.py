import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env file
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ API Key not found. Please ensure .env file has GOOGLE_API_KEY or GEMINI_API_KEY.")
else:
    print(f"🔑 API Key found (starts with: {api_key[:5]}...)")
    genai.configure(api_key=api_key)
    
    print("\n📋 Available Models:")
    print("="*30)
    try:
        count = 0
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name} (Display: {m.display_name})")
                count += 1
        
        if count == 0:
            print("⚠️ No models found with 'generateContent' capability.")
            
    except Exception as e:
        print(f"❌ Error listing models: {e}")
