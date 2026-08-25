import os
import re

modules = [
    "attendance", "leaderboard", "apikey", "audit", 
    "support", "parent", "affiliate", "aiQuiz", "test-series"
]
base_dir = "/Users/balveerchoudhary/testbook-platform/server/src/modules"

for module in modules:
    mod_dir = os.path.join(base_dir, module)
    if not os.path.exists(mod_dir):
        print(f"Skipping {module}, not found.")
        continue
    
    # Delete model files
    for f in os.listdir(mod_dir):
        if ".model." in f:
            os.remove(os.path.join(mod_dir, f))
            print(f"Deleted {f} in {module}")
    
    # Process files
    for f in os.listdir(mod_dir):
        if not (f.endswith('.ts') or f.endswith('.js')):
            continue
            
        filepath = os.path.join(mod_dir, f)
        with open(filepath, 'r') as file:
            content = file.read()
            
        original_content = content
        
        # Remove mongoose
        content = re.sub(r"import\s+.*?mongoose.*?;\n?", "", content)
        content = re.sub(r"import\s+.*?from\s+['\"].*\.model(\.js|\.ts)?['\"];\n?", "", content)
        
        # Add prisma if not there and we need it
        if "prisma" not in content and ("import" in content or "export" in content):
            # Only add if we replace something
            pass
            
        # Common replaces
        content = content.replace("._id", ".id")
        content = content.replace("._id.toString()", ".id")
        
        # Repositories fixes
        content = re.sub(r"constructor\([^)]*Model[^)]*\)\s*{", "constructor() {", content)
        content = re.sub(r"super\([^)]*\);", "super();", content)
        
        if content != original_content:
            if "prisma from" not in content:
                content = "import prisma from '../../config/prisma.js';\n" + content
            with open(filepath, 'w') as file:
                file.write(content)
            print(f"Updated {f} in {module}")
            
print("Done!")
