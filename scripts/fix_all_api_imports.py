import os
import re

root_dir = "front/src"

# Target mapping for API filenames
api_map = {
    "user": "shared/api/user",
    "auth": "shared/api/user",
    "youtube": "shared/api/youtube",
    "hotplace": "shared/api/hotplace",
    "novel": "shared/api/novel",
    "search": "shared/api/search",
    "chatbot": "shared/api/chatbot",
    "channels": "shared/api/channelsApi",
    "channelsApi": "shared/api/channelsApi"
}

def get_rel_path(from_file, to_shared_api_suffix):
    from_dir = os.path.dirname(from_file)
    target_abs = os.path.normpath(os.path.join("front/src", to_shared_api_suffix))
    rel = os.path.relpath(target_abs, from_dir).replace("\\", "/")
    if not rel.startswith("."): rel = "./" + rel
    return rel

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            full_path = os.path.join(root, file)
            # Skip shared/api itself to avoid fixing its own neighbor imports if they are already relative
            if "shared/api" in os.path.normpath(full_path) and not file.endswith(".jsx"): continue

            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            changed = False
            # Regex for any import from a path ending in one of our API names
            # Handles:
            # from '../../api/user'
            # from '../../../auth/api/auth'
            # from '../api/youtube'
            for key, target in api_map.items():
                pattern = r"(from\s+['\"])(\.\.?/.*api/" + key + r")(['\"])"
                regex = re.compile(pattern)
                if regex.search(content):
                    new_rel = get_rel_path(full_path, target)
                    content = regex.sub(r"\1" + new_rel + r"\3", content)
                    changed = True
            
            if changed:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed API import in: {full_path}")

print("Comprehensive API Path Fix Complete.")
