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

const stringsToRemove = [
  "import { Link } from 'react-router-dom';\n",
  "import { Button } from '@/components/ui';\n",
  "import { NavLink } from 'react-router-dom';\n",
  "import { Input } from '@/components/ui';\n",
  "import LoadingSpinner from '@/components/common/LoadingSpinner';\n"
];

const paths = [
  path.join(process.cwd(), 'client', 'src'),
  path.join(process.cwd(), 'admin', 'src')
];

for (const p of paths) {
  const files = findJsxFiles(p);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // We prepend multiple times, so they are at the very top of the file.
    // Loop to remove any of the strings as long as the file starts with them.
    let changed = true;
    while(changed) {
      changed = false;
      for (const str of stringsToRemove) {
        if (content.startsWith(str)) {
          content = content.substring(str.length);
          changed = true;
        }
      }
    }
    
    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log(`Reverted ${file}`);
    }
  }
}
