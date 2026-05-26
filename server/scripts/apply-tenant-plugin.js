import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modulesDir = path.join(__dirname, '../src/modules');

const skipFiles = ['institute.model.js', 'subscriptionPlan.model.js'];

function getModelFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getModelFiles(filePath, files);
    } else if (file.endsWith('.model.js') && !skipFiles.includes(file)) {
      files.push(filePath);
    }
  });
  return files;
}

const files = getModelFiles(modulesDir);
console.log(`Found ${files.length} model files to process.`);

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const basename = path.basename(file);

  // Check if tenantPlugin is already imported
  if (content.includes('tenantPlugin')) {
    console.log(`Skipping ${basename} - tenantPlugin already applied.`);
    return;
  }

  // 1. Add import
  const importTarget = "import paginatePlugin from '../../models/plugins/paginatePlugin.js';";
  const importReplacement = `${importTarget}\nimport tenantPlugin from '../../models/plugins/tenantPlugin.js';`;

  if (content.includes(importTarget)) {
    content = content.replace(importTarget, importReplacement);
  } else {
    console.warn(`Could not find paginatePlugin import in ${basename}`);
    return;
  }

  // 2. Add plugin call
  // Match any variation like: xSchema.plugin(paginatePlugin);
  const pluginRegex = /(\w+Schema)\.plugin\(paginatePlugin\);/g;
  if (pluginRegex.test(content)) {
    content = content.replace(pluginRegex, '$1.plugin(paginatePlugin);\n$1.plugin(tenantPlugin);');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Successfully applied tenantPlugin to ${basename}`);
  } else {
    console.warn(`Could not find Schema.plugin(paginatePlugin) call in ${basename}`);
  }
});
