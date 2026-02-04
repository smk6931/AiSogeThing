import os
import re

# 1. API 파일 내부의 client.js 경로 수정
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
            
            # import client from './client' -> '../../../shared/api/client'
            new_content = content.replace("from './client'", "from '../../../shared/api/client'")
            
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated client path in: {full_path}")

# 2. 전체 컴포넌트에서 API 임포트 경로 수정
root_dir = "front/src"

mapping = {
    "shared/api/user": "apps/auth/api/auth",
    "shared/api/youtube": "apps/content/api/youtube",
    "shared/api/hotplace": "apps/content/api/hotplace",
    "shared/api/novel": "apps/content/api/novel",
    "shared/api/search": "apps/content/api/search",
    "shared/api/chatbot": "apps/content/api/chatbot",
    "shared/api/channelsApi": "apps/content/api/channels"
}

def get_rel_path(from_file, to_app_path):
    # from_file: front/src/apps/content/pages/Home/Home.jsx
    # to_app_path: apps/auth/api/auth
    from_dir = os.path.dirname(from_file)
    target_abs = os.path.join("front/src", to_app_path)
    rel = os.path.relpath(target_abs, from_dir).replace("\\", "/")
    if not rel.startswith("."): rel = "./" + rel
    return rel

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            full_path = os.path.join(root, file)
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            changed = False
            for old_suffix, new_app_path in mapping.items():
                # 패턴: import ... from '...shared/api/user'
                # 정규식으로 'shared/api/...' 문자열을 찾아서 상대 경로로 계산
                pattern = r"(['\"])(\.\.?/)+(shared/api/" + old_suffix.split("/")[-1] + r")(['\"])"
                
                # 수동 매칭 (정규식보다 세밀하게)
                if "shared/api/" + old_suffix.split("/")[-1] in content:
                    new_rel = get_rel_path(full_path, new_app_path)
                    # 기존에 어떤 상대 경로가 와도 저 문자열만 있으면 새로운 상대 경로로 대체
                    # 간단하게 문자열 치환 시도 (문제가 될 수 있으니 주의)
                    # 실제로는 import { ... } from '.../shared/api/user' 형식임
                    
                    found_imports = re.findall(r"from\s+['\"](\.\.?/.*shared/api/" + old_suffix.split("/")[-1] + r")['\"]", content)
                    for imp_path in set(found_imports):
                        pass
                    
                    # Regex-based replacement for robustness
                    regex = re.compile(r"(from\s+['\"])(\.\.?/.*shared/api/" + old_suffix.split("/")[-1] + r")(['\"])")
                    if regex.search(content):
                        content = regex.sub(r"\1" + new_rel + r"\3", content)
                        changed = True
            
            if changed:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Refactored imports in: {full_path}")

print("API Refactoring Complete.")
