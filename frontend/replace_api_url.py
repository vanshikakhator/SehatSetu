import os
import re

directory = 'src'

# Regex patterns to find hardcoded localhost:5000
# 1. Inside string literals: "http://localhost:5000/api/..." -> import.meta.env.VITE_API_URL + "/api/..."
# 2. Inside template literals: `http://localhost:5000/api/...` -> `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/...`
# 3. Bare url: 'http://localhost:5000' -> import.meta.env.VITE_API_URL || 'http://localhost:5000'

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # 1. Template literals: `http://localhost:5000/some/path`
    content = re.sub(
        r'`http://localhost:5000([^`]+)`',
        r'`${import.meta.env.VITE_API_URL || "http://localhost:5000"}\1`',
        content
    )
    
    # 2. String literals: 'http://localhost:5000/some/path'
    content = re.sub(
        r'\'http://localhost:5000([^\']+)\'',
        r'(import.meta.env.VITE_API_URL || "http://localhost:5000") + \'\1\'',
        content
    )
    
    # 3. String literals (double quotes): "http://localhost:5000/some/path"
    content = re.sub(
        r'"http://localhost:5000([^"]+)"',
        r'(import.meta.env.VITE_API_URL || "http://localhost:5000") + "\1"',
        content
    )
    
    # 4. Standalone string literals without trailing path
    content = content.replace("'http://localhost:5000'", '(import.meta.env.VITE_API_URL || "http://localhost:5000")')
    content = content.replace('"http://localhost:5000"', '(import.meta.env.VITE_API_URL || "http://localhost:5000")')
    content = content.replace('`http://localhost:5000`', '`${import.meta.env.VITE_API_URL || "http://localhost:5000"}`')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            replace_in_file(os.path.join(root, file))

