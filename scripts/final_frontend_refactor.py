import os
import re

root_dir = "front/src"
shared_folders = ["api", "hooks", "utils", "styles"]

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
        # Match any relative import that eventually leads to the target folder, 
        # optionally through 'shared/'
        # Group 1: Quote, Group 3: Optional 'shared/', Group 4: Folder name
        pattern = rf"(['\"`])(\.\./)+(shared/)?({folder}/?)"
        replacement = rf"\1{src_prefix}shared/\4"
        
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
            changed = True

    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed Depth {depth}: {rel_from_src}")

for root, dirs, files in os.walk(root_dir):
    if "shared" in root: continue
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            fix_imports(os.path.join(root, file))

print("Final Precision Refactoring Complete.")
