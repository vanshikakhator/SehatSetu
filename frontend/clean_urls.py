import os
import re

directory = 'src'

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace (import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000"))
    # with (import.meta.env.VITE_API_URL || "http://localhost:5000")
    new_content = content.replace(
        '(import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000"))',
        '(import.meta.env.VITE_API_URL || "http://localhost:5000")'
    )
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            clean_file(os.path.join(root, file))
