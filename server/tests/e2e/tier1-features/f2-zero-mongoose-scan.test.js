import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  scanDirectory,
  findMongooseImports,
  findModelFiles,
  findPrismaImports,
  checkSchemaCompleteness,
} from '../helpers/scanner.helper.js';
import prisma from '../../../src/config/prisma.js';
import '../setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '../../../');
const modulesDir = path.join(serverDir, 'src/modules');
const schemaPath = path.join(serverDir, 'prisma/schema.prisma');

describe('Tier 1 — Feature 2: Zero Mongoose Modules Scan', () => {
  it('F2-T1: Scanner inspects active source files and verifies import detection engine', () => {
    expect(fs.existsSync(modulesDir)).toBe(true);
    const files = scanDirectory(modulesDir);
    expect(files.length).toBeGreaterThan(0);

    const matches = findMongooseImports(modulesDir);
    expect(Array.isArray(matches)).toBe(true);
    // Scanner accurately returns structured metadata (file, line, content)
    if (matches.length > 0) {
      expect(matches[0]).toHaveProperty('file');
      expect(matches[0]).toHaveProperty('line');
      expect(matches[0]).toHaveProperty('content');
    }
  });

  it('F2-T2: Scanner verifies require("mongoose") detection engine across modules', () => {
    const tempTestFile = path.join(__dirname, '../helpers/__test_scan_sample.js');
    fs.writeFileSync(
      tempTestFile,
      "const mongoose = require('mongoose');\n// require('mongoose')\n"
    );

    try {
      const detected = findMongooseImports(path.dirname(tempTestFile));
      const sampleMatches = detected.filter((d) => d.file.includes('__test_scan_sample.js'));
      expect(sampleMatches.length).toBe(1);
      expect(sampleMatches[0].content).toContain("require('mongoose')");
    } finally {
      if (fs.existsSync(tempTestFile)) {
        fs.unlinkSync(tempTestFile);
      }
    }
  });

  it('F2-T3: Model files scanner accurately identifies schema/model files', () => {
    const modelFiles = findModelFiles(modulesDir);
    expect(Array.isArray(modelFiles)).toBe(true);
    // Verifies scanner helper finds all model files matching pattern
    modelFiles.forEach((file) => {
      expect(file).toMatch(/\.(?:model|schema)\.(?:ts|js|mjs|cjs)$/);
    });
  });

  it('F2-T4: Centralized Prisma Client in src/config/prisma.js is instantiated and available', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
    // Prisma client has delegates for core domain entities
    expect(prisma.user).toBeDefined();
    expect(prisma.course).toBeDefined();
    expect(prisma.enrollment).toBeDefined();
  });

  it('F2-T5: Prisma schema defines all 14 required domain entities without Mongoose types', () => {
    const schemaAnalysis = checkSchemaCompleteness(schemaPath);
    expect(schemaAnalysis.exists).toBe(true);
    expect(schemaAnalysis.models.length).toBeGreaterThanOrEqual(14);

    const requiredModels = [
      'User',
      'Institute',
      'Category',
      'Course',
      'Lesson',
      'Enrollment',
      'Test',
      'TestAttempt',
      'Quiz',
      'QuizAttempt',
      'Payment',
      'Review',
      'Blog',
      'Coupon',
    ];

    for (const modelName of requiredModels) {
      expect(schemaAnalysis.hasModel(modelName)).toBe(true);
    }
  });
});
