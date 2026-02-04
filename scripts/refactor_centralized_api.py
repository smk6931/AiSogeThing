import os
import re

root_dir = "front/src"

# 1. API 파일 내부의 client 임포트 경로 수정 (상위 폴더의 client.js 참조)
# 위치: src/shared/api/content/youtube.js -> ../client.js
api_root = "front/src/shared/api"
for root, dirs, files in os.walk(api_root):
    for file in files:
        if file.endswith(".js") and file != "client.js":
            full_path = os.path.join(root, file)
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # 절대 경로 Alias 사용: '@api/client'
            new_content = re.sub(r"from\s+['\"](\.\.?/)*api/client['\"]", "from '@api/client'", content)
            new_content = re.sub(r"from\s+['\"](\.\.?/)*client['\"]", "from '@api/client'", new_content)
            
            if content != new_content:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Fixed client import in API file: {full_path}")

# 2. 전체 컴포넌트의 API 임포트를 @api 중심으로 정규화
mapping = {
    # 엣지 케이스 및 기존의 잘못된 Alias/상대경로 매칭
    r"apps/auth/api/auth": "@api/auth/auth",
    r"apps/content/api/youtube": "@api/content/youtube",
    r"apps/content/api/hotplace": "@api/content/hotplace",
    r"apps/content/api/novel": "@api/content/novel",
    r"apps/content/api/search": "@api/content/search",
    r"apps/content/api/chatbot": "@api/content/chatbot",
    r"apps/content/api/channels": "@api/content/channels",
    
    # 순수 파일명 매칭 (shared/api/user -> @api/auth/auth 로 변경 추천)
    r"shared/api/user": "@api/auth/auth",
    r"shared/api/youtube": "@api/content/youtube",
    r"shared/api/hotplace": "@api/content/hotplace",
    r"shared/api/novel": "@api/content/novel",
    r"shared/api/search": "@api/content/search",
    r"shared/api/chatbot": "@api/content/chatbot",
    r"shared/api/channelsApi": "@api/content/channels"
}

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            full_path = os.path.join(root, file)
            if "shared/api" in root: continue # API 폴더 내부 논외

            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            changed = False
            for old_p, new_a in mapping.items():
                regex = re.compile(r"from\s+['\"](\.\.?/)*" + old_p + r"['\"]")
                if regex.search(content):
                    content = regex.sub(f"from '{new_a}'", content)
                    changed = True
            
            if changed:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Refactored to Centralized API Alias: {full_path}")

# 3. 그 외 Context 등 기본 Alias 보정
def apply_core_aliases():
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".js", ".jsx")):
                full_path = os.path.join(root, file)
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # shared/context/AuthContext -> @shared/context/AuthContext
                new_content = re.sub(r"from\s+['\"](\.\.?/)*shared/context/AuthContext['\"]", "from '@shared/context/AuthContext'", content)
                if content != new_content:
                    with open(full_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Core Alias Applied: {full_path}")

apply_core_aliases()
print("Centralized API Refactoring Complete.")
