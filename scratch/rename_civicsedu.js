import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.system_generated',
  '.gemini',
  '.expo',
]);

const EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.html',
  '.md',
  '.env',
  '.env.example',
  '.css',
  '.svg',
]);

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.has(file)) {
        walk(fullPath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const allFiles = walk(ROOT_DIR);
let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (
    content.includes('CivicsEdu') ||
    content.includes('Civics Edu') ||
    content.includes('civicsedu') ||
    content.includes('CIVICSEDU') ||
    content.includes('>Hub<')
  ) {
    // 1. Full replacements
    content = content.replace(/CivicsEdu/g, 'CivicsEdu');
    content = content.replace(/Civics Edu/g, 'Civics Edu');
    content = content.replace(/civicsedu/g, 'civicsedu');
    content = content.replace(/CIVICSEDU/g, 'CIVICSEDU');

    // 2. Logo span replacements: Civics<span ...>Edu</span> -> Civics<span ...>Edu</span>
    content = content.replace(/(Civics<span[^>]*>)Hub(<\/span>)/g, '$1Edu$2');

    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated: ${path.relative(ROOT_DIR, file)}`);
  }
}

console.log(`\nFinished! Modified ${modifiedCount} files.`);
