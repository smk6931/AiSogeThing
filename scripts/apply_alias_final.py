import os
import re

# 1. 이동된 API 파일 내부의 client 임포트 경로 수정 (절대 경로 활용)
api_dirs = [
    "front/src/apps/auth/api",
    "front/src/apps/content/api",
    "front/src/apps/game/api"
]

for api_dir in api_dirs:
    if not os.path.exists(api_dir): continue
    for file in os.listdir(api_dir):
        if file.endswith(".js"):
            full_path = os.path.join(api_dir, file)
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # import client from './client' 또는 '../client' 또는 '../../shared/api/client'
            # -> 모두 '@api/client'로 통일
            new_content = re.sub(r"from\s+['\"](\.\.?/)*api/client['\"]", "from '@api/client'", content)
            new_content = re.sub(r"from\s+['\"](\.\.?/)*client['\"]", "from '@api/client'", new_content)
            
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated client path to Alias (@api/client) in: {full_path}")

# 2. 전체 컴포넌트에서 API 및 Shared 경로를 Alias로 일괄 전환
mapping = {
    # API mappings
    r"shared/api/user": "@auth/api/auth",
    r"apps/auth/api/auth": "@auth/api/auth",
    r"shared/api/youtube": "@content/api/youtube",
    r"apps/content/api/youtube": "@content/api/youtube",
    r"shared/api/hotplace": "@content/api/hotplace",
    r"apps/content/api/hotplace": "@content/api/hotplace",
    r"shared/api/novel": "@content/api/novel",
    r"apps/content/api/novel": "@content/api/novel",
    r"shared/api/search": "@content/api/search",
    r"apps/content/api/search": "@content/api/search",
    r"shared/api/chatbot": "@content/api/chatbot",
    r"apps/content/api/chatbot": "@content/api/chatbot",
    r"shared/api/channelsApi": "@content/api/channels",
    r"apps/content/api/channels": "@content/api/channels",
    
    # Context mappings
    r"shared/context/AuthContext": "@shared/context/AuthContext",
    
    # App mappings (Optional but recommended for cross-app or deep imports)
    r"apps/content/components/common": "@content/components/common",
    r"apps/auth/pages/Login": "@auth/pages/Login"
}

root_dir = "front/src"

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            full_path = os.path.join(root, file)
            # API 파일 자체는 1번에서 처리했으므로 스킵
            if "api" in root and ("apps" in root): continue

            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            changed = False
            for old_pattern, new_alias in mapping.items():
                # 정규식: from '.../pattern'
                regex = re.compile(r"from\s+['\"](\.\.?/)*" + old_pattern + r"['\"]")
                if regex.search(content):
                    content = regex.sub(f"from '{new_alias}'", content)
                    changed = True
            
            if changed:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Applied Alias to: {full_path}")

print("Alias Refactoring Complete.")
