import os
import re

def process_file(filepath, module):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Replace all `import mongoose from 'mongoose'`
    content = re.sub(r"import\s+mongoose\s+from\s+['\"]mongoose['\"];\n?", "", content)
    
    # 2. Replace import Model from './*.model.js'
    content = re.sub(r"import\s+[A-Za-z]+\s+from\s+['\"]./\w+\.model(\.js|\.ts)?['\"];\n?", "", content)

    # Add prisma import
    if "prisma from" not in content and "prisma" in content.lower():
        content = "import prisma from '../../config/prisma.js';\n" + content

    # 3. Replace Model methods with prisma equivalent
    # e.g., Payment.find -> prisma.payment.findMany
    model_map = {
        'Payment': 'payment',
        'Coupon': 'coupon',
        'Review': 'review',
        'Blog': 'blog'
    }

    for model_name, prisma_name in model_map.items():
        content = re.sub(fr"\b{model_name}\.find\(", f"prisma.{prisma_name}.findMany(", content)
        content = re.sub(fr"\b{model_name}\.findOne\(", f"prisma.{prisma_name}.findFirst(", content)
        content = re.sub(fr"\b{model_name}\.findById\(", f"prisma.{prisma_name}.findUnique(", content)
        content = re.sub(fr"\b{model_name}\.findByIdAndUpdate\(", f"prisma.{prisma_name}.update(", content)
        content = re.sub(fr"\b{model_name}\.findByIdAndDelete\(", f"prisma.{prisma_name}.delete(", content)
        content = re.sub(fr"\b{model_name}\.create\(", f"prisma.{prisma_name}.create(", content)
        content = re.sub(fr"\b{model_name}\.countDocuments\(", f"prisma.{prisma_name}.count(", content)
        content = re.sub(fr"\b{model_name}\.aggregate\(", f"prisma.{prisma_name}.groupBy(", content)
        content = re.sub(fr"\b{model_name}\.", f"prisma.{prisma_name}.", content)

    # 4. Replace doc._id -> doc.id
    content = content.replace("._id", ".id")
    
    # 5. Replace doc.save() -> prisma.model.update
    content = re.sub(r"(\w+)\.save\(\)", rf"prisma.{module}.update({{ where: {{ id: \1.id }}, data: \1 }})", content)

    # 6. Replace objectId stuff
    content = re.sub(r"new\s+mongoose\.Types\.ObjectId\(([^)]+)\)", r"\1", content)
    content = re.sub(r"mongoose\.Types\.ObjectId\.isValid\(([^)]+)\)", r"(\1.length > 0)", content)

    with open(filepath, 'w') as f:
        f.write(content)

modules = ["payment", "coupon", "review", "blog"]
base_dir = "/Users/balveerchoudhary/testbook-platform/server/src/modules"

for module in modules:
    mod_dir = os.path.join(base_dir, module)
    if not os.path.exists(mod_dir):
        continue
    
    for f in os.listdir(mod_dir):
        if f.endswith('.ts') or f.endswith('.js'):
            filepath = os.path.join(mod_dir, f)
            process_file(filepath, module)

print("Migration applied")
