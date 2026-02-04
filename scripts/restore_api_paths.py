import os
import re

# 1. API 파일 내부의 client.js 경로 원복
api_dir = "front/src/shared/api"

for file in os.listdir(api_dir):
    if file.endswith(".js") and file != "client.js":
        full_path = os.path.join(api_dir, file)
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # '../../../shared/api/client' -> './client'
        new_content = content.replace("from '../../../shared/api/client'", "from './client'")
        
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Restored client path in: {full_path}")

# 2. 전체 컴포넌트에서 API 임포트 경로를 shared/api로 원복
root_dir = "front/src"

# Mapping of what to find and what it becomes
# Since we renamed back to user.js and channelsApi.js for safety
mapping = {
    "apps/auth/api/auth": "shared/api/user",
    "apps/content/api/youtube": "shared/api/youtube",
    "apps/content/api/hotplace": "shared/api/hotplace",
    "apps/content/api/novel": "shared/api/novel",
    "apps/content/api/search": "shared/api/search",
    "apps/content/api/chatbot": "shared/api/chatbot",
    "apps/content/api/channels": "shared/api/channelsApi"
}

def get_rel_path(from_file, to_shared_api_suffix):
    # from_file: front/src/apps/content/pages/Home/Home.jsx
    # to_shared_api_suffix: shared/api/youtube
    from_dir = os.path.dirname(from_file)
    target_abs = os.path.join("front/src", to_shared_api_suffix)
    rel = os.path.relpath(target_abs, from_dir).replace("\\", "/")
    if not rel.startswith("."): rel = "./" + rel
    return rel

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            full_path = os.path.join(root, file)
            # Skip shared/api itself to avoid circular thoughts
            if "shared/api" in full_path and not file.endswith(".jsx"): continue

            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            changed = False
            for old_app_path, new_shared_path in mapping.items():
                # 찾을 패턴: '.../apps/auth/api/auth'
                regex = re.compile(r"(from\s+['\"])(\.\.?/.*" + old_app_path + r")(['\"])")
                if regex.search(content):
                    new_rel = get_rel_path(full_path, new_shared_path)
                    content = regex.sub(r"\1" + new_rel + r"\3", content)
                    changed = True
            
            if changed:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Restored imports in: {full_path}")

print("API Path Restoration Complete.")
