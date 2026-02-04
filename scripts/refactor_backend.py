import os
import re

root_dir = "back/content"
targets = ["user", "novel", "youtube", "search", "hotplace", "chatbot"]

def fix_file(file_path):
    # Normalize path for comparison
    norm_path = file_path.replace("\\", "/")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Update imports: from X -> from content.X
    for target in targets:
        content = re.sub(rf'from {target}\b', f'from content.{target}', content)
        content = re.sub(rf'import {target}\b', f'import content.{target}', content)

    # 2. Update prefixes in routers
    content = re.sub(r'prefix="/api/(?!content/)(auth|novel|youtube|search|hotplace|chatbot)"', r'prefix="/api/content/\1"', content)
    
    # Special Handling for Youtube
    if "youtube/router.py" in norm_path:
        if 'router = APIRouter()' in content:
            content = content.replace('router = APIRouter()', 'router = APIRouter(prefix="/api/content/youtube", tags=["Youtube"])')
            # Remove redundant /api/youtube from decorators
            content = content.replace('@router.get("/api/youtube', '@router.get("')
            content = content.replace('@router.post("/api/youtube', '@router.post("')
            content = content.replace('@router.put("/api/youtube', '@router.put("')
            content = content.replace('@router.delete("/api/youtube', '@router.delete("')
        
    if "hotplace/router.py" in norm_path:
        if 'router = APIRouter(' in content and 'prefix' not in content:
             content = content.replace('router = APIRouter(', 'router = APIRouter(prefix="/api/content/hotplace", ')
             content = content.replace('@router.get("/api/search', '@router.get("/search')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".py"):
            fix_file(os.path.join(root, file))

print("Backend content refactoring complete (Imports and Prefixes).")
