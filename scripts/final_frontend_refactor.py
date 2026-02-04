import os
import re

root_dir = "front/src"
# Added 'context' to shared_folders
shared_folders = ["api", "hooks", "utils", "styles", "context"]

def fix_imports(file_path):
    rel_from_src = os.path.relpath(file_path, root_dir).replace("\\", "/")
    parts = os.path.dirname(rel_from_src).split("/")
    depth = len([p for p in parts if p])
    
    if depth == 0: return 
    
    src_prefix = "../" * depth
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False
    
    for folder in shared_folders:
        # Match any relative import that leads to the folder
        # We need to be careful with paths like '../../context' 
        # which might have been correct in the old structure but are now wrong.
        
        # This matches:
        # 1. Old paths: ../context or ../../context
        # 2. Over-corrected paths: ../../../shared/context etc.
        pattern = rf"(['\"`])(\.\./)+(shared/|apps/content/)?({folder}/?)"
        replacement = rf"\1{src_prefix}shared/{folder}/"
        
        # Special case: don't double add / if folder already has it or is a file name used as folder
        # For simplicity, we'll just fix the prefix
        
        # Let's use a more robust regex to target specifically the relative prefix
        # and ensure it points to src/shared/folder
        
        # Find any import to a shared folder name, regardless of how many ../ it has
        content = re.sub(rf"(['\"`])(\.\./)+({folder})\b", rf"\1{src_prefix}shared/\3", content)
        # Also handle cases where they were moved into content
        content = re.sub(rf"(['\"`])(\.\./)+(apps/content/)?({folder})\b", rf"\1{src_prefix}shared/\4", content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for root, dirs, files in os.walk(root_dir):
    if "shared" in root: continue
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            fix_imports(os.path.join(root, file))

print("Context-inclusive precision refactoring complete.")
