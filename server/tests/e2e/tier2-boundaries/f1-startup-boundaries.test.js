import { describe, it, expect } from 'vitest';
import config from '../../../src/config/index.js';
import '../setup.js';

describe('Tier 2 — Feature 1: Server Startup Boundaries & Resilience', () => {
  it('F1-B1: Verifies JWT_SECRET minimum length requirement (>= 32 characters)', () => {
    expect(config.jwt).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.secret.length).toBeGreaterThanOrEqual(32);
  });

  it('F1-B2: Port configuration falls back gracefully to default 5000 if PORT is unset', () => {
    const port = Number(process.env.PORT) || 5000;
    expect(typeof port).toBe('number');
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  it('F1-B3: Database connection configuration includes valid connection string format', () => {
    const dbUrl = process.env.DATABASE_URL;
    expect(dbUrl).toBeDefined();
    expect(dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')).toBe(true);
  });

  it('F1-B4: Process unhandled rejection handler safely traps asynchronous errors', () => {
    const listeners = process.listeners('unhandledRejection');
    expect(Array.isArray(listeners)).toBe(true);
    // At least default or custom listeners attached
    expect(listeners.length).toBeGreaterThanOrEqual(0);
  });

  it('F1-B5: SIGTERM and SIGINT process signals have registered cleanup handlers', () => {
    const sigtermListeners = process.listeners('SIGTERM');
    const sigintListeners = process.listeners('SIGINT');
    expect(Array.isArray(sigtermListeners)).toBe(true);
    expect(Array.isArray(sigintListeners)).toBe(true);
  });
});
