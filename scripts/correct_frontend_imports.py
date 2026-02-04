import os
import re

root_dir = "front/src"
shared_folders = ["api", "hooks", "utils", "styles"]

def fix_imports(file_path):
    rel_path = os.path.relpath(file_path, root_dir).replace("\\", "/")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False
    
    # Correcting the previous over-correction (../../../shared -> ../../shared)
    # Most files in src/apps/content/... or src/apps/game/... were moved 1 level deeper
    # Original: src/pages/X.jsx (depth 1) -> ../api (depth 0)
    # New: src/apps/content/pages/X.jsx (depth 3) -> ../../../shared/api (depth 0)
    # Wait, let's trace carefully:
    # 1. front/src/apps/content/pages/Home/Home.jsx (Depth 4)
    #    .. -> apps/content/pages
    #    ../.. -> apps/content
    #    ../../../ -> apps
    #    ../../../../ -> src
    #    ../../../../shared/api/ -> front/src/shared/api/
    #    So depth 4 needs 4 levels.
    
    # 2. front/src/apps/game/GameEntry.jsx (Depth 3)
    #    .. -> front/src/apps
    #    ../.. -> front/src
    #    ../../shared/api -> front/src/shared/api
    #    So depth 3 needs 2 levels to get to src. No, depth 3 needs 2 levels to get to src?
    #    front (0) / src (1) / apps (2) / game (3) / GameEntry.jsx (4)
    #    Actually:
    #    front/src/apps/game/GameEntry.jsx
    #    1: GameEntry.jsx
    #    2: game
    #    3: apps
    #    4: src
    #    5: front
    #    If we are at GameEntry.jsx:
    #    ../ -> apps/game/
    #    ../../ -> apps/
    #    ../../../ -> src/  <-- Correct!
    #    Wait, src/shared/api... 
    #    So from apps/game/GameEntry.jsx to src/shared/api:
    #    ../../shared/api (No, that's src/apps/shared/api)
    #    ../../../shared/api (That's src/shared/api)
    
    # Let's re-verify the depth of GameEntry.jsx
    # c:\GitHub\AiSogeThing\front\src\apps\game\GameEntry.jsx
    # Relative to front: src/apps/game/GameEntry.jsx (4 components)
    # Relative to src: apps/game/GameEntry.jsx (3 components)
    
    # From GameEntry.jsx:
    # ../ -> apps/game/
    # ../../ -> apps/
    # ../../../ -> src/
    
    # So if it's at src/apps/game/GameEntry.jsx, it needs ../../../shared/api.
    # Why did Vite fail then?
    # Failed to resolve import "../../../shared/api/user" from "src/apps/game/GameEntry.jsx"
    
    # AH! Vite error says "src/apps/game/GameEntry.jsx". 
    # In Vite, paths are often relative to the project root (where vite.config.js is).
    # Project root is 'front/'.
    # So the file is 'src/apps/game/GameEntry.jsx'.
    # If the import is '../../../shared/api/user':
    # src/apps/game/ -> src/apps/ -> src/ -> [root]/ -> [parent of front]/shared/api/user
    # THAT IS WRONG!
    
    # It should be relative to 'src/apps/game/GameEntry.jsx':
    # To get to 'src/shared/api/user':
    # .. (src/apps/game/) -> .. (src/apps/) -> .. (src/) -> shared/api/user? No.
    # Wait: 
    # File: src/apps/game/GameEntry.jsx
    # 1 step up: src/apps/game/
    # 2 steps up: src/apps/
    # 3 steps up: src/
    # So ../../../shared/api/user means it looks in the directory ABOVE src.
    
    # Let's check where 'shared' is.
    # It's in 'front/src/shared'.
    # So from 'front/src/apps/game/GameEntry.jsx' to 'front/src/shared/api/user':
    # ../ (src/apps/game/)
    # ../../ (src/apps/)
    # ../../../ (src/) -- wait, ../../ is src/ !!
    
    # Let's count again:
    # [front/src]/apps/game/GameEntry.jsx
    # 1. ../ -> front/src/apps/
    # 2. ../../ -> front/src/
    # 3. ../../shared/api/user -> front/src/shared/api/user.js
    
    # YES! 2 levels is correct for Depth 3 (relative to src).
    # My script was wrong. I should have accounted for the fact that depth 1 -> depth 3.
    # Depth 1 (e.g. src/game/X) to src/api (depth 1) is ../api
    # Depth 3 (e.g. src/apps/game/X) to src/shared/api (depth 2) is ../../shared/api
    
    # Wait, shared is in src/shared? Yes.
    # Original: src/game/GameEntry.jsx -> src/api/user.js  (Distance: ../api/user)
    # New: src/apps/game/GameEntry.jsx -> src/shared/api/user.js
    #   ../ (src/apps/)
    #   ../../ (src/)
    #   ../../shared/api/user -> SUCCESS.
    
    # So 2 levels is definitely correct.
    
    patterns = [
        (r"'\.\./\.\./\.\./shared/", r"'../../shared/"),
        (r"\"\.\./\.\./\.\./shared/", r"\"../../shared/"),
        (r"`\.\./\.\./\.\./shared/", r"`../../shared/"),
    ]
    
    for old, new in patterns:
        content = re.sub(old, new, content)
        if content != f.read: # Check if changed
             changed = True

    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed: {file_path}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            fix_imports(os.path.join(root, file))

print("Frontend imports correction complete.")
