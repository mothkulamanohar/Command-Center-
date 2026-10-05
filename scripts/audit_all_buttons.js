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
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles('./app').concat(getFiles('./components'));

let buttons = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match full button elements
  const btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  while ((match = btnRegex.exec(content)) !== null) {
    const attrs = match[1];
    const body = match[2];
    const line = content.substring(0, match.index).split('\n').length;
    const text = body.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ').substring(0, 50);

    // Extract onClick
    const onClickMatch = attrs.match(/onClick=\{([\s\S]*?)\}(?:\s+[a-zA-Z]|\s*>)/);
    const isSubmit = /type\s*=\s*['"]submit['"]/.test(attrs);
    const onClick = onClickMatch ? onClickMatch[1].trim().replace(/\s+/g, ' ') : null;

    buttons.push({
      file: path.relative('.', file),
      line,
      text: text || '[Icon/Empty]',
      hasOnClick: !!onClick,
      isSubmit,
      onClick
    });
  }
});

console.log('Total buttons scanned:', buttons.length);
const withoutHandler = buttons.filter(b => !b.hasOnClick && !b.isSubmit);
console.log('Buttons without onClick and not submit:', withoutHandler.length);
withoutHandler.forEach(b => console.log(`[NO_ACTION] ${b.file}:${b.line} -> "${b.text}"`));

const dummyOrConsole = buttons.filter(b => b.onClick && (
  b.onClick === '()=>{}' ||
  b.onClick === '()=>undefined' ||
  b.onClick.includes('console.log')
));
console.log('Buttons with dummy or console.log handlers:', dummyOrConsole.length);
dummyOrConsole.forEach(b => console.log(`[DUMMY] ${b.file}:${b.line} -> "${b.text}" -> ${b.onClick}`));
