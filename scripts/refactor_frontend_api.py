import os

api_dir = "front/src/shared/api"
endpoints = ["auth", "youtube", "novel", "chatbot", "search", "hotplace"]

def fix_api_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Update /api/X -> /api/content/X
    for ep in endpoints:
        # Avoid double replacing
        content = content.replace(f"'/api/{ep}", f"'/api/content/{ep}")
        content = content.replace(f'"/api/{ep}', f'"/api/content/{ep}')
        content = content.replace(f"`/api/{ep}", f"`/api/content/{ep}")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for file in os.listdir(api_dir):
    if file.endswith(".js"):
        fix_api_file(os.path.join(api_dir, file))

print("Frontend API endpoints refactoring complete.")
