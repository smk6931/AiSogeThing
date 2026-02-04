import os
import re

root_dir = "front/src"
shared_folders = ["api", "hooks", "utils", "styles"]

def fix_imports(file_path):
    # Normalize relative path from src
    rel_from_src = os.path.relpath(file_path, root_dir).replace("\\", "/")
    # Number of directories above the file to reach src
    # e.g. apps/game/GameEntry.jsx -> 2 (apps, apps/game)
    # Wait, os.path.dirname(rel_from_src) is "apps/game"
    # depth = "apps/game".split("/") -> ["apps", "game"] -> len = 2
    depth = len(os.path.dirname(rel_from_src).split("/")) if os.path.dirname(rel_from_src) else 0
    
    if depth == 0: return # File in src/ root, e.g. main.jsx
    
    # Prefix to reach src
    src_prefix = "../" * depth
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False
    
    # We are looking for any import to shared folders
    # The previous scripts might have left paths like ../../shared or ../../../shared
    # We want to normalize them to src_prefix + "shared/"
    
    for folder in shared_folders:
        # Regex to find any relative import ending in /folder or /folder/
        # e.g. import ... from '../../../api/user'
        # Group 1: total relative path, Group 2: the folder part
        pattern = rf"(['\"`])(\.\./)+({folder}/?)"
        
        # Replacement should be src_prefix + "shared/" + folder
        replacement = rf"\1{src_prefix}shared/\3"
        
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
            changed = True

    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {depth} depth: {rel_from_src}")

for root, dirs, files in os.walk(root_dir):
    # Skip shared directory itself to avoid recursive complexity (though the script handles prefix)
    if "shared" in root: continue
    
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            fix_imports(os.path.join(root, file))

print("Precision frontend imports refactoring complete.")
