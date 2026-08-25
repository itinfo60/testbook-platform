import fs from 'fs';
import path from 'path';

/**
 * Recursively scans a directory for files
 */
export function scanDirectory(dirPath, options = {}) {
  const {
    extensions = ['.js', '.ts', '.mjs', '.cjs'],
    ignoreDirs = ['node_modules', '.git', 'dist', 'coverage'],
  } = options;
  const results = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.length === 0 || extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dirPath);
  return results;
}

/**
 * Searches for active Mongoose imports/requires in source files
 */
export function findMongooseImports(dirPath, options = {}) {
  const { ignoreComments = true } = options;
  const files = scanDirectory(dirPath);
  const matches = [];

  const importRegex =
    /(?:import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]*\})|(?:\w+))\s+from\s+['"]mongoose['"])|(?:require\s*\(\s*['"]mongoose['"]\s*\))|(?:import\s*\(\s*['"]mongoose['"]\s*\))/;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      let trimmed = line.trim();
      if (ignoreComments) {
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }
      }
      if (importRegex.test(trimmed)) {
        matches.push({
          file: filePath,
          line: index + 1,
          content: trimmed,
        });
      }
    });
  }

  return matches;
}

/**
 * Searches for Mongoose schema/model files (.model.ts, .model.js, etc.)
 */
export function findModelFiles(dirPath) {
  const files = scanDirectory(dirPath, { extensions: [] });
  const modelRegex = /\.(?:model|schema)\.(?:ts|js|mjs|cjs)$/;
  return files.filter((f) => modelRegex.test(path.basename(f)));
}

/**
 * Searches for files importing Prisma Client
 */
export function findPrismaImports(dirPath) {
  const files = scanDirectory(dirPath);
  const prismaImportRegex =
    /(?:from\s+['"][^'"]*config\/prisma(?:\.js)?['"])|(?:from\s+['"]@prisma\/client['"])/;
  const matches = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (prismaImportRegex.test(content)) {
      matches.push(filePath);
    }
  }

  return matches;
}

/**
 * Inspects schema.prisma to verify model definitions
 */
export function checkSchemaCompleteness(schemaPath) {
  if (!fs.existsSync(schemaPath)) {
    return { exists: false, models: [] };
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /^model\s+(\w+)\s+\{/gm;
  const models = [];
  let match;

  while ((match = modelRegex.exec(content)) !== null) {
    models.push(match[1]);
  }

  return {
    exists: true,
    models,
    hasModel: (name) => models.includes(name),
  };
}
