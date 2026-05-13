import fs from 'fs';
import path from 'path';

function findJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsxFiles(filePath, fileList);
    } else if (filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = findJsxFiles(path.join(process.cwd(), 'src'));
const commonGlobals = new Set(['React', 'document', 'window', 'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Promise', 'Error', 'JSON', 'Map', 'Set']);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find all JSX tags starting with Capital letter
  const jsxRegex = /<([A-Z][a-zA-Z0-9_]*)/g;
  let match;
  const usedComponents = new Set();
  
  while ((match = jsxRegex.exec(content)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Find all variables defined in file
  const defined = new Set([...commonGlobals]);
  
  // imports: import { X, Y } from 'Z' or import X from 'Z'
  const importRegex = /import\s+(?:\{([^}]+)\}|([a-zA-Z0-9_]+))\s+from/g;
  while ((match = importRegex.exec(content)) !== null) {
    if (match[1]) {
      const parts = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]); // handle alias later if needed but usually we just want what is imported. Wait, import { X as Y } -> X is match, but we use Y. Actually `X as Y` means Y is defined.
      parts.forEach(p => {
        const aliasMatch = p.split(/\s+as\s+/);
        defined.add(aliasMatch[aliasMatch.length - 1].trim());
      });
    }
    if (match[2]) defined.add(match[2].trim());
  }
  
  // functions, consts, lets
  const declRegex = /(?:function|const|let|var|class)\s+([a-zA-Z0-9_]+)/g;
  while ((match = declRegex.exec(content)) !== null) {
    defined.add(match[1].trim());
  }

  // function params
  const paramRegex = /function\s+[a-zA-Z0-9_]*\s*\(\s*\{([^}]+)\}/g;
  while ((match = paramRegex.exec(content)) !== null) {
     match[1].split(',').forEach(p => {
        defined.add(p.split(/[=:]/)[0].trim());
     });
  }
  
  // check
  for (const component of usedComponents) {
    // skip fragments and native
    if (component === 'Fragment' || component === 'motion') continue; // specialized handling
    if (!defined.has(component) && !content.includes(`import ${component}`) && !content.includes(` ${component} `)) {
      // simple fallback check
      if(!content.match(new RegExp(`import.*\\\\b${component}\\\\b`))) {
         console.log(`${file}: Missing ${component}`);
      }
    }
  }
}
