import fs from 'fs';
import path from 'path';

function findJsxFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
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

const paths = [
  path.join(process.cwd(), 'client', 'src'),
  path.join(process.cwd(), 'admin', 'src')
];

for (const p of paths) {
  const files = findJsxFiles(p);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Link
    if (/<Link\b/.test(content) && !/import\s+(?:\{[^}]*\bLink\b[^}]*\}|\bLink\b)\s+from/.test(content)) {
      content = "import { Link } from 'react-router-dom';\n" + content;
      changed = true;
    }
    // Button
    if (/<Button\b/.test(content) && !/import\s+(?:\{[^}]*\bButton\b[^}]*\}|\bButton\b)\s+from/.test(content)) {
      content = "import { Button } from '@/components/ui';\n" + content;
      changed = true;
    }
    // NavLink
    if (/<NavLink\b/.test(content) && !/import\s+(?:\{[^}]*\bNavLink\b[^}]*\}|\bNavLink\b)\s+from/.test(content)) {
      content = "import { NavLink } from 'react-router-dom';\n" + content;
      changed = true;
    }
    // Input
    if (/<Input\b/.test(content) && !/import\s+(?:\{[^}]*\bInput\b[^}]*\}|\bInput\b)\s+from/.test(content)) {
      content = "import { Input } from '@/components/ui';\n" + content;
      changed = true;
    }
    // LoadingSpinner
    if (/<LoadingSpinner\b/.test(content) && !/import\s+\bLoadingSpinner\b\s+from/.test(content)) {
      content = "import LoadingSpinner from '@/components/common/LoadingSpinner';\n" + content;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Fixed ${file}`);
    }
  }
}
