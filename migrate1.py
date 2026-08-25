import os
import re

modules = ["payment", "coupon", "review", "blog"]
base_dir = "/Users/balveerchoudhary/testbook-platform/server/src/modules"

for module in modules:
    mod_dir = os.path.join(base_dir, module)
    if not os.path.exists(mod_dir):
        print(f"Skipping {module}")
        continue
    
    # 1. Update Repository
    repo_file = None
    if os.path.exists(os.path.join(mod_dir, f"{module}.repository.ts")):
        repo_file = os.path.join(mod_dir, f"{module}.repository.ts")
    elif os.path.exists(os.path.join(mod_dir, f"{module}.repository.js")):
        repo_file = os.path.join(mod_dir, f"{module}.repository.js")
    
    if repo_file:
        with open(repo_file, 'r') as f:
            content = f.read()
        
        # Remove mongoose imports
        content = re.sub(r"import\s+\{\s*Model\s*\}\s+from\s+['\"]mongoose['\"];\n?", "", content)
        content = re.sub(r"import\s+[A-Za-z]+\s+from\s+['\"]./\w+\.model(\.js|\.ts)?['\"];\n?", "", content)
        
        # Add prisma import
        if "prisma" not in content:
            content = "import prisma from '../../config/prisma.js';\n" + content
        
        # Update constructor
        # E.g.: constructor(model: Model<ICoupon> = Coupon) {
        # E.g.: constructor(model: Model<IPayment> = Payment as Model<IPayment>) {
        
        content = re.sub(
            r"constructor\(model[^)]*\)\s*\{",
            f"constructor(model = prisma.{module}) {{",
            content
        )
        content = re.sub(r"super\(model\);", "super(model as any);", content)
        
        # In coupon.repository.ts:
        # const result = await (this.model as any).paginate(scopedFilter, options);
        # we can replace with super.paginate(scopedFilter, options)
        content = content.replace("(this.model as any).paginate", "super.paginate")
        
        with open(repo_file, 'w') as f:
            f.write(content)
            
    # 2. Update Controller
    ctrl_files = [f for f in os.listdir(mod_dir) if f.endswith('.controller.ts') or f.endswith('.controller.js')]
    for ctrl_file in ctrl_files:
        path = os.path.join(mod_dir, ctrl_file)
        with open(path, 'r') as f:
            content = f.read()
        
        # Replace Model imports
        content = re.sub(r"import\s+[A-Za-z]+\s+from\s+['\"]./\w+\.model(\.js|\.ts)?['\"];\n?", "", content)
        # Import prisma if needed
        # We might need it if the controller uses it directly
        if "prisma" not in content and re.search(r"prisma\.", content):
            pass # We'll add if required
            
        with open(path, 'w') as f:
            f.write(content)

    # 3. Update Service
    svc_files = [f for f in os.listdir(mod_dir) if f.endswith('.service.ts') or f.endswith('.service.js')]
    for svc_file in svc_files:
        path = os.path.join(mod_dir, svc_file)
        with open(path, 'r') as f:
            content = f.read()
        
        # Replace mongoose imports
        content = re.sub(r"import\s+mongoose\s+from\s+['\"]mongoose['\"];\n?", "", content)
        content = re.sub(r"import\s+[A-Za-z]+\s+from\s+['\"]./\w+\.model(\.js|\.ts)?['\"];\n?", "", content)
        
        content = content.replace("mongoose.Types.ObjectId()", "''")
        
        with open(path, 'w') as f:
            f.write(content)

print("Done phase 1")
