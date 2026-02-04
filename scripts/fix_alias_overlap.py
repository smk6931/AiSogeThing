import os
import re

root_dir = "front/src"

# 1. @도메인/api -> @api/도메인 매핑
alias_fix_map = {
    r"@auth/api/": "@api/auth/",
    r"@content/api/": "@api/content/",
    r"@game/api/": "@api/game/",
}

# 2. 상대 경로 shared/api/client -> @api/client 매핑
path_fix_map = {
    r"(\.\.?/)+shared/api/client": "@api/client",
    r"shared/api/client": "@api/client",
}

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            full_path = os.path.join(root, file)
            
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            changed = False
            
            # Alias Fix (@content/api -> @api/content)
            for old_a, new_a in alias_fix_map.items():
                if old_a in content:
                    content = content.replace(old_a, new_a)
                    changed = True
            
            # Path Fix (../../shared/api/client -> @api/client)
            for old_p, new_p in path_fix_map.items():
                # regex to handle quotes and possible extensions
                regex = re.compile(r"(['\"])" + old_p + r"(['\"])")
                if regex.search(content):
                    content = regex.sub(r"\1" + new_p + r"\3", content)
                    changed = True
            
            if changed:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed imports in: {full_path}")

print("Import correction complete.")
