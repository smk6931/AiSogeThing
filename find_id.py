import os
import requests
from dotenv import load_dotenv

# Try loading .env from multiple locations
if os.path.exists("back/.env"):
    load_dotenv("back/.env")
elif os.path.exists(".env"):
    load_dotenv(".env")
    
API_KEY = os.getenv("YOUTUBE_API_KEY") or os.getenv("VITE_YOUTUBE_API_KEY")

def find_channel(query):
    if not API_KEY:
        print("Error: No API KEY found")
        return

    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=channel&key={API_KEY}"
    try:
        headers = {"Referer": "http://localhost:5173"}
        res = requests.get(url, headers=headers)
        data = res.json()
        
        if 'error' in data:
            print(f"API Error detected: {data['error']['message']}")
            return

        if 'items' in data and len(data['items']) > 0:
            print(f"{query}: {data['items'][0]['id']['channelId']}")
        else:
            print(f"{query}: Not Found (Items empty)")
            # print(data) # Too verbose?
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Redirect print to file
    import sys
    original_stdout = sys.stdout
    with open("ids.txt", "w", encoding="utf-8") as f:
        sys.stdout = f
        print(f"Using Key: {API_KEY[:5]}..." if API_KEY else "No Key")
        find_channel("김달")
        find_channel("촌장엔터테인먼트TV")
        find_channel("heartsignal") # 하트시그널 (English query might be safer)
    sys.stdout = original_stdout

