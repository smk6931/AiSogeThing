import os
import re

root_dir = "back"
targets = ["user", "novel", "youtube", "search", "hotplace", "chatbot"]

def fix_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    new_lines = []
    changed = False
    for line in lines:
        new_line = line
        # Match 'from user...', 'import user...', but NOT 'from content.user...'
        # Positive lookbehind for start of line or space or dot is tricky.
        # Let's use words.
        
        # 1. from target ...
        # Match 'from youtube ' or 'from youtube.models'
        for target in targets:
            # Replaces 'from youtube' with 'from content.youtube' ONLY if not already preceded by 'content.'
            if f'from {target}' in new_line and f'from content.{target}' not in new_line:
                new_line = new_line.replace(f'from {target}', f'from content.{target}')
                changed = True
            
            # 2. import target
            if f'import {target}' in new_line and f'import content.{target}' not in new_line:
                 # Be careful not to replace something like 'import user_service'
                 # We want 'import user' (exact word)
                 new_line = re.sub(rf'\bimport {target}\b', f'import content.{target}', new_line)
                 changed = True
                 
        new_lines.append(new_line)

    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"Fixed: {file_path}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".py"):
            fix_file(os.path.join(root, file))

print("Final Thorough Scan Complete.")
