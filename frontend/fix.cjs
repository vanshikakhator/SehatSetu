const fs = require('fs');
const file = 'frontend/src/pages/AuthPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// The style object in inputs looks like: style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
// I'll just add `background: "transparent", color: COLORS.text, ` after `style={{ `

content = content.replace(/style=\{\{ /g, 'style={{ background: "rgba(0, 240, 255, 0.05)", color: COLORS.text, ');

// Also fix the select that had backgroundColor: "black", color: "white"
content = content.replace(/backgroundColor: "black", color: "white"/g, 'backgroundColor: COLORS.surface, color: COLORS.text');

fs.writeFileSync(file, content);
console.log('Fixed inputs in AuthPage.jsx');
