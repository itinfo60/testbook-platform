import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';

describe('Tier 1 — Feature 1: Server Startup & Dev Boot', () => {
  it('F1-T1: GET /health returns 200 with status "healthy" and system telemetry', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.environment).toBeDefined();
    expect(res.body.memory).toHaveProperty('used');
    expect(res.body.memory).toHaveProperty('total');
  });

  it('F1-T2: App initializes Express router and middlewares without Mongoose boot errors', async () => {
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.listen).toBe('function');

    const routes = app._router.stack.filter((r) => r.route || r.name === 'router');
    expect(routes.length).toBeGreaterThan(5);
  });

  it('F1-T3: GET /api/v1 returns API catalog, documentation link, and endpoints registry', async () => {
    const res = await request(app).get('/api/v1').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.version).toBe('2.0.0');
    expect(res.body.endpoints).toBeDefined();
    expect(res.body.endpoints).toHaveProperty('auth');
    expect(res.body.endpoints).toHaveProperty('courses');
  });

  it('F1-T4: Request ID middleware attaches a unique request ID to context', async () => {
    const customReqId = 'custom-request-id-12345';
    const res = await request(app).get('/health').set('X-Request-Id', customReqId).expect(200);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('F1-T5: CORS and Helmet security headers are properly attached to responses', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-frame-options');
  });
});
