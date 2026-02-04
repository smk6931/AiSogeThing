import os
import re

root_dir = "front/src/shared"

def fix_shared_imports(file_path):
    # Relative path from src/shared
    rel_from_shared = os.path.relpath(file_path, root_dir).replace("\\", "/")
    # Depth within shared/
    # shared/api/client.js -> depth 1 (api)
    # shared/context/AuthContext.jsx -> depth 1 (context)
    parts = os.path.dirname(rel_from_shared).split("/")
    depth = len([p for p in parts if p])
    
    # Prefix to reach shared/
    shared_prefix = "../" * depth if depth > 0 else "./"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False
    
    # Patterns to match incorrect absolute/relative imports that were generated
    # e.g. ../../../shared/api/client
    # We want to change them to be relative within shared/ if possible, 
    # or at least correct relative to src/
    
    # Case: ../../../shared/X or ../../shared/X pointing back into shared from within shared
    # From src/shared/context/AuthContext.jsx:
    # ../api/client is correct.
    
    # Let's just fix the specific broken ones in AuthContext for now and scan others.
    new_content = re.sub(r"(['\"`])(\.\./)+shared/", r"\1../", content) 
    # if we are in shared/context/X, ../ gets to shared/
    
    if new_content != content:
        content = new_content
        changed = True

    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed Shared: {rel_from_shared}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            fix_shared_imports(os.path.join(root, file))
