import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# ========================================================
#  Google Gemini Client (Chat Only)
# ========================================================

def get_chat_model(model="gemini-pro", temperature=0.7):
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key: return None
    
    return ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        google_api_key=api_key
    )

async def generate_response_gemini(prompt: str, system_role: str = "Assistant"):
    llm = get_chat_model()
    if not llm: return "API Key missing."
    
    try:
        # Gemini는 SystemMessage를 일부 모델에서 다르게 처리하지만 LangChain이 추상화해줌
        messages = [
            SystemMessage(content=system_role),
            HumanMessage(content=prompt)
        ]
        res = await llm.ainvoke(messages)
        return res.content
    except Exception as e:
        print(f"⚠️ Gemini Chat Error: {e}")
        return "Error generating response."
