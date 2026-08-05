const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let changed = 0;
for (const file of files) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');

  // Skip if already migrated
  if (!html.includes('cdn.tailwindcss.com')) continue;

  // 1. Replace CDN script with local stylesheet
  html = html.replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<link rel="stylesheet" href="assets/tailwind.css">'
  );

  // 2. Remove the tailwind.config inline script block (multiline)
  html = html.replace(
    /\n?<script>\s*\ntailwind\.config\s*=\s*\{[\s\S]*?\}\s*\n<\/script>\n?/g,
    '\n'
  );

  fs.writeFileSync(fp, html, 'utf8');
  console.log(`✓ ${file}`);
  changed++;
}

console.log(`\nDone: ${changed} files updated.`);
