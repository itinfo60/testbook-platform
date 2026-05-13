const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
};

const dirs = ['./client/src', './admin/src', './server/src'];
let files = [];
dirs.forEach(d => {
  if (fs.existsSync(d)) files = files.concat(walk(d));
});

let cleanedFiles = 0;
let totalLogsRemoved = 0;

files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  let newLines = [];
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    // Delete the line if it only contains console.log
    if (/^\s*console\.log\(.*\);?\s*$/.test(lines[i])) {
      changed = true;
      totalLogsRemoved++;
    } else {
      newLines.push(lines[i]);
    }
  }

  if (changed) {
    fs.writeFileSync(f, newLines.join('\n'));
    cleanedFiles++;
  }
});

console.log(`Removed ${totalLogsRemoved} lines of console.log across ${cleanedFiles} files.`);
