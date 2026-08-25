import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scanDirectory, findMongooseImports, findModelFiles } from '../helpers/scanner.helper.js';
import '../setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Tier 2 — Feature 2: Static Code Scanner Boundaries & Edge Cases', () => {
  const fixtureDir = path.join(__dirname, '__temp_scan_fixtures__');

  beforeAll(() => {
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  it('F2-B1: Scanner correctly ignores commented-out mentions of mongoose', () => {
    const testFile = path.join(fixtureDir, 'commented.js');
    fs.writeFileSync(
      testFile,
      '// import mongoose from "mongoose";\n/* require("mongoose"); */\n// const x = mongoose;\n'
    );

    const matches = findMongooseImports(fixtureDir, { ignoreComments: true });
    const fileMatches = matches.filter((m) => m.file === testFile);
    expect(fileMatches.length).toBe(0);
  });

  it('F2-B2: Scanner recursively explores arbitrary deeply nested directory trees', () => {
    const deepDir = path.join(fixtureDir, 'level1/level2/level3');
    fs.mkdirSync(deepDir, { recursive: true });
    const deepFile = path.join(deepDir, 'nested.ts');
    fs.writeFileSync(deepFile, "import mongoose from 'mongoose';\n");

    const matches = findMongooseImports(fixtureDir, { ignoreComments: false });
    const found = matches.find((m) => m.file === deepFile);
    expect(found).toBeDefined();
    expect(found.line).toBe(1);
  });

  it('F2-B3: Scanner checks both .ts and .js source files for forbidden patterns', () => {
    const tsFile = path.join(fixtureDir, 'forbidden.ts');
    const jsFile = path.join(fixtureDir, 'forbidden.js');
    fs.writeFileSync(tsFile, "import mongoose from 'mongoose';\n");
    fs.writeFileSync(jsFile, "const m = require('mongoose');\n");

    const matches = findMongooseImports(fixtureDir);
    const tsMatch = matches.find((m) => m.file === tsFile);
    const jsMatch = matches.find((m) => m.file === jsFile);

    expect(tsMatch).toBeDefined();
    expect(jsMatch).toBeDefined();
  });

  it('F2-B4: Scanner detects dynamic import("mongoose") and require("mongoose")', () => {
    const dynamicFile = path.join(fixtureDir, 'dynamic.js');
    fs.writeFileSync(dynamicFile, "const m = await import('mongoose');\n");

    const matches = findMongooseImports(fixtureDir);
    const dynamicMatch = matches.find((m) => m.file === dynamicFile);
    expect(dynamicMatch).toBeDefined();
  });

  it('F2-B5: Model files scanner identifies all variations of schema and model filenames', () => {
    const m1 = path.join(fixtureDir, 'user.model.ts');
    const m2 = path.join(fixtureDir, 'order.model.js');
    const m3 = path.join(fixtureDir, 'schema.model.mjs');
    const s1 = path.join(fixtureDir, 'test.schema.ts');
    const normal = path.join(fixtureDir, 'normal.service.ts');

    fs.writeFileSync(m1, '// model');
    fs.writeFileSync(m2, '// model');
    fs.writeFileSync(m3, '// model');
    fs.writeFileSync(s1, '// schema');
    fs.writeFileSync(normal, '// service');

    const detected = findModelFiles(fixtureDir);
    const detectedNames = detected.map((f) => path.basename(f));

    expect(detectedNames).toContain('user.model.ts');
    expect(detectedNames).toContain('order.model.js');
    expect(detectedNames).toContain('schema.model.mjs');
    expect(detectedNames).toContain('test.schema.ts');
    expect(detectedNames).not.toContain('normal.service.ts');
  });
});
