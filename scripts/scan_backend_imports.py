import os
import re

root_dir = "back"
targets = ["user", "novel", "youtube", "search", "hotplace", "chatbot"]

def fix_file(file_path):
    norm_path = file_path.replace("\\", "/")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Update imports: from X -> from content.X
    changed = False
    for target in targets:
        # Match "from target" or "import target" or "from target.models"
        new_content = re.sub(rf'\bfrom {target}\b', f'from content.{target}', content)
        new_content = re.sub(rf'\bimport {target}\b', f'import content.{target}', new_content)
        if new_content != content:
            content = new_content
            changed = True

    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed: {norm_path}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".py"):
            fix_file(os.path.join(root, file))

print("Scan complete.")
