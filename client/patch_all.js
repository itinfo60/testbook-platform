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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const requiresLink = /<Link\b/.test(content);
  const hasLinkImport = /import\s+(?:\{[^}]*\bLink\b[^}]*\}|\bLink\b)\s+from/.test(content);
  if (requiresLink && !hasLinkImport) {
    content = "import { Link } from 'react-router-dom';\n" + content;
    changed = true;
  }

  const requiresButton = /<Button\b/.test(content);
  const hasButtonImport = /import\s+(?:\{[^}]*\bButton\b[^}]*\}|\bButton\b)\s+from/.test(content);
  if (requiresButton && !hasButtonImport) {
    content = "import { Button } from '@/components/ui';\n" + content;
    changed = true;
  }
  
  const requiresNavLink = /<NavLink\b/.test(content);
  const hasNavLinkImport = /import\s+(?:\{[^}]*\bNavLink\b[^}]*\}|\bNavLink\b)\s+from/.test(content);
  if (requiresNavLink && !hasNavLinkImport) {
    content = "import { NavLink } from 'react-router-dom';\n" + content;
    changed = true;
  }
  
  const requiresInput = /<Input\b/.test(content);
  const hasInputImport = /import\s+(?:\{[^}]*\bInput\b[^}]*\}|\bInput\b)\s+from/.test(content);
  if (requiresInput && !hasInputImport) {
    content = "import { Input } from '@/components/ui';\n" + content;
    changed = true;
  }

  // Also catch LoadingSpinner
  const requiresLoadingSpinner = /<LoadingSpinner\b/.test(content);
  const hasLoadingSpinnerImport = /import\s+\bLoadingSpinner\b\s+from/.test(content);
  if (requiresLoadingSpinner && !hasLoadingSpinnerImport) {
    content = "import LoadingSpinner from '@/components/common/LoadingSpinner';\n" + content;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
}
