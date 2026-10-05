const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
        results = results.concat(getFiles(fullPath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles('./app').concat(getFiles('./components'));

let totalButtons = 0;
let deadButtons = [];
let mockDataUsage = [];
let dummyHandlers = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Check buttons
  const btnTagRegex = /<button([\s\S]*?)>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = btnTagRegex.exec(content)) !== null) {
    totalButtons++;
    const attrs = match[1];
    const innerText = match[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ').substring(0, 40);
    const line = content.substring(0, match.index).split('\n').length;
    const hasOnClick = /onClick\s*=/.test(attrs);
    const isSubmit = /type\s*=\s*['"]submit['"]/.test(attrs);

    if (!hasOnClick && !isSubmit) {
      deadButtons.push({
        file: path.relative('.', file),
        line,
        text: innerText || '[icon/empty]',
        attrs: attrs.trim().replace(/\s+/g, ' ').substring(0, 80)
      });
    }

    // Check dummy or trivial handlers
    const onClickMatch = attrs.match(/onClick\s*=\s*\{([^}]+)\}/);
    if (onClickMatch) {
      const handlerBody = onClickMatch[1].trim();
      if (
        handlerBody === '() => {}' ||
        handlerBody === '() => undefined' ||
        handlerBody.includes('console.log') ||
        handlerBody === '() => null'
      ) {
        dummyHandlers.push({
          file: path.relative('.', file),
          line,
          text: innerText || '[icon/empty]',
          handler: handlerBody
        });
      }
    }
  }

  // Check MOCK data usage
  lines.forEach((l, idx) => {
    if (/MOCK_[A-Z_]+/.test(l) && !file.includes('mock')) {
      mockDataUsage.push({
        file: path.relative('.', file),
        line: idx + 1,
        code: l.trim()
      });
    }
  });
});

console.log('=== AUDIT REPORT ===');
console.log('Total Buttons:', totalButtons);
console.log('Buttons with no onClick and no type="submit":', deadButtons.length);
console.log('Buttons with dummy/trivial handlers:', dummyHandlers.length);
console.log('Files importing/using MOCK_ constants:', mockDataUsage.length);

console.log('\n--- DEAD BUTTONS (NO ONCLICK & NOT SUBMIT) ---');
deadButtons.forEach(b => console.log(`[${b.file}:${b.line}] Text: "${b.text}" | Attrs: ${b.attrs}`));

console.log('\n--- DUMMY HANDLERS ---');
dummyHandlers.forEach(b => console.log(`[${b.file}:${b.line}] Text: "${b.text}" | Handler: ${b.handler}`));

console.log('\n--- MOCK DATA REFERENCES IN APP & COMPONENTS ---');
mockDataUsage.forEach(m => console.log(`[${m.file}:${m.line}] ${m.code}`));
