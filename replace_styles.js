const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('frontend/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace hardcoded backgrounds
  content = content.replace(/background: "#fff"/g, 'background: COLORS.surface');
  content = content.replace(/background: "#f0faf5"/g, 'background: COLORS.surfaceAlt');
  content = content.replace(/background: "#f8fafc"/g, 'background: COLORS.surfaceAlt');
  
  // Replace fonts
  content = content.replace(/fontFamily: "'Segoe UI', system-ui, sans-serif"/g, 'fontFamily: "var(--font-display)"');
  
  // Replace hardcoded #000 or #333 or similar if needed, but let's stick to the main ones
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
