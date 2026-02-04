import os
import re

root_dir = "front/src"

def check_imports(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # regex for 'import ... from ...' and 'import "..."'
    # Group 1: path
    imports = re.findall(r"from\s+['\"](\.\.?/.*?)['\"]", content)
    imports += re.findall(r"import\s+['\"](\.\.?/.*?)['\"]", content)
    
    errors = []
    for imp in set(imports):
        curr_dir = os.path.dirname(file_path)
        base_path = os.path.normpath(os.path.join(curr_dir, imp))
        
        # Possible extensions
        extensions = [
            "", ".js", ".jsx", ".css", ".png", ".jpg", ".svg",
            "/index.js", "/index.jsx"
        ]
        
        found = False
        for ext in extensions:
            if os.path.exists(base_path + ext):
                found = True
                break
        
        if not found:
            errors.append(imp)
            
    if errors:
        print(f"FILE: {file_path}")
        for err in errors:
            print(f"  MISSING: {err}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            check_imports(os.path.join(root, file))

print("Scan Complete.")
