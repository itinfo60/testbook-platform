import sys

filepath = '/Users/balveerchoudhary/testbook-platform/client/src/features/test/pages/TestSeriesCatalog.jsx'
with open(filepath, 'r') as f:
    content = f.read()

# Keep gradients
content = content.replace("from-amber-500 to-orange-500", "TEMP_GRADIENT")

# Specific requested replacements
content = content.replace("bg-amber-500 hover:bg-amber-600", "bg-primary-600 hover:bg-primary-700")
content = content.replace("bg-slate-900 hover:bg-amber-500", "bg-primary-600 hover:bg-primary-700")
content = content.replace("shadow-slate-900/20", "shadow-primary-600/20")
content = content.replace("focus:ring-amber-500", "focus:ring-primary-500")

# Word replacements
replacements = {
    "amber-500/10": "primary-500/10",
    "amber-500/20": "primary-500/20",
    "amber-500/30": "primary-500/30",
    "shadow-amber-500/20": "shadow-primary-500/20",
    "shadow-amber-900/20": "shadow-primary-900/20",
    "amber-900/50": "primary-900/50",
    "amber-800/50": "primary-800/50",
    "amber-950": "primary-950",
    "amber-900": "primary-900",
    "amber-800": "primary-800",
    "amber-700": "primary-700",
    "amber-600": "primary-600",
    "amber-500": "primary-600",
    "amber-400": "primary-400",
    "amber-300": "primary-300",
    "amber-200": "primary-200",
    "amber-100": "primary-100",
    "amber-50": "primary-50",
}

for k in sorted(replacements.keys(), key=len, reverse=True):
    content = content.replace(k, replacements[k])

# Restore gradients
content = content.replace("TEMP_GRADIENT", "from-amber-500 to-orange-500")

with open(filepath, 'w') as f:
    f.write(content)

print("Done")
