import re

file_path = "src/pages/AuthPage.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace inline styles for inputs to ensure they have dark background and light text
content = re.sub(r'style=\{\{\s*width', 'style={{ background: "rgba(0, 240, 255, 0.05)", color: COLORS.text, width', content)
content = content.replace('backgroundColor: "black", color: "white"', 'backgroundColor: "rgba(0, 240, 255, 0.05)", color: COLORS.text')
content = content.replace('background: "#fff"', 'background: "transparent"')

with open(file_path, "w") as f:
    f.write(content)

print("Fixed inputs in AuthPage.jsx")
