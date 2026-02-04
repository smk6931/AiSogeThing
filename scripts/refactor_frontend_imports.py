import os
import re

root_dir = "front/src"
shared_folders = ["api", "hooks", "utils", "styles"]
app_folders = ["apps/content", "apps/game"]

def fix_imports(file_path):
    # Normalize path
    rel_path = os.path.relpath(file_path, root_dir).replace("\\", "/")
    depth = rel_path.count("/")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern: from '../api/...' or import '../api/...'
    # We want to replace paths that point to old top-level folders
    
    # If the file is inside apps/
    if rel_path.startswith("apps/"):
        for folder in shared_folders:
            # Match any relative path that ends in /folder/
            # e.g. ../api or ../../api
            # We need to prepend more ../ and change to shared/folder
            
            # This is complex with regex. Let's try a simpler logic:
            # Any import that was originally relative to src/
            # e.g. if file was src/pages/Home.jsx, it used ../api
            # Now it's src/apps/content/pages/Home.jsx, it has 2 more levels.
            
            # Rule: If it's a content app file, add "../../shared/" to any import that was "../"
            # But wait, not all imports were "../". Some were "../../".
            
            # Let's just do literal replacements for common patterns found in the project.
            patterns = [
                # src/pages/ -> ../api  becomes src/apps/content/pages/ -> ../../../shared/api
                (rf"'\.\./{folder}'", rf"'../../../shared/{folder}'"),
                (rf"'\.\./{folder}/", rf"'../../../shared/{folder}/"),
                (rf"\"\.\./{folder}\"", rf"\"../../../shared/{folder}\""),
                (rf"\"\.\./{folder}/", rf"\"../../../shared/{folder}/"),
                
                # src/pages/Home/ -> ../../api becomes src/apps/content/pages/Home/ -> ../../../../shared/api
                (rf"'\.\./\.\./{folder}'", rf"'../../../../shared/{folder}'"),
                (rf"'\.\./\.\./{folder}/", rf"'../../../../shared/{folder}/"),
                (rf"\"\.\./\.\./{folder}\"", rf"\"../../../../shared/{folder}\""),
                (rf"\"\.\./\.\./{folder}/", rf"\"../../../../shared/{folder}/"),
            ]
            
            for old, new in patterns:
                content = re.sub(old, new, content)

    # Special case for App.jsx (already handled manually but just in case)
    # Special case for components moved into content
    if rel_path.startswith("apps/content/pages"):
         # Pages used to import from ../components
         # Now they are in apps/content/pages and import from ../components? 
         # Wait, src/pages -> src/components was ../components.
         # Now src/apps/content/pages -> src/apps/content/components is STILL ../components.
         # SO THIS IS FINE.
         pass

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            fix_imports(os.path.join(root, file))

print("Frontend imports refactoring complete.")
