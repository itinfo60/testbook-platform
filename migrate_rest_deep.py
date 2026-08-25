import os
import re

modules = [
    "attendance", "leaderboard", "apikey", "audit", 
    "support", "parent", "affiliate", "aiQuiz", "test-series"
]
base_dir = "/Users/balveerchoudhary/testbook-platform/server/src/modules"

def process_file(filepath):
    with open(filepath, 'r') as file:
        content = file.read()
    
    orig = content
    
    # regexes for models
    # Example: Model.find(...) -> prisma.model.findMany({ where: ... })
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.find\(", r"prisma.\1.findMany({ where: ", content)
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.findOne\(", r"prisma.\1.findFirst({ where: ", content)
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.findById\(", r"prisma.\1.findUnique({ where: { id: ", content)
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.create\(", r"prisma.\1.create({ data: ", content)
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.findByIdAndUpdate\(", r"prisma.\1.update({ where: ", content)
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.findByIdAndDelete\(", r"prisma.\1.delete({ where: ", content)
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.countDocuments\(", r"prisma.\1.count({ where: ", content)
    content = re.sub(r"([A-Z][a-zA-Z0-9]*)\.aggregate\(", r"prisma.\1.groupBy({ ", content)

    # lower case the model name in prisma.Model
    def lower_model(match):
        return f"prisma.{match.group(1)[0].lower() + match.group(1)[1:]}."
    content = re.sub(r"prisma\.([A-Z][a-zA-Z0-9]*)\.", lower_model, content)
    
    # Some other mongoose stuff
    content = re.sub(r"new\s+mongoose\.Types\.ObjectId\((.*?)\)", r"\1", content)
    
    if orig != content:
        with open(filepath, 'w') as file:
            file.write(content)
        print(f"Deep updated {filepath}")

for module in modules:
    mod_dir = os.path.join(base_dir, module)
    if not os.path.exists(mod_dir):
        continue
    for f in os.listdir(mod_dir):
        if not (f.endswith('.ts') or f.endswith('.js')):
            continue
        process_file(os.path.join(mod_dir, f))
