/**
 * tenantPlugin.test.js
 *
 * Integration tests for TenantContext (AsyncLocalStorage) and the Mongoose
 * tenantPlugin.  These tests share the in-memory MongoDB connection that is
 * opened by tests/setup.js (global beforeAll/afterAll) so we must NOT call
 * mongoose.connect() here again.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { runWithTenant, getTenantId, isBypassTenant } from '../../src/utils/TenantContext.js';
import tenantPlugin from '../../src/models/plugins/tenantPlugin.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

const model = (name, schemaOpts = {}, pluginOpts = {}) => {
  if (mongoose.models[name]) return mongoose.models[name];
  const schema = new mongoose.Schema(
    { title: { type: String, required: true } },
    { timestamps: true, ...schemaOpts }
  );
  schema.plugin(tenantPlugin, pluginOpts);
  return mongoose.model(name, schema);
};

// ─── fixtures ─────────────────────────────────────────────────────────────────

const tenantAlpha = new mongoose.Types.ObjectId();
const tenantBeta = new mongoose.Types.ObjectId();

// ─────────────────────────────────────────────────────────────────────────────
describe('TenantContext (AsyncLocalStorage)', () => {
  it('getTenantId returns null outside any context', () => {
    expect(getTenantId()).toBeNull();
  });

  it('isBypassTenant returns false outside any context', () => {
    expect(isBypassTenant()).toBe(false);
  });

  it('runWithTenant binds tenantId within the callback', async () => {
    const tid = tenantAlpha.toString();
    await runWithTenant(tid, false, async () => {
      expect(getTenantId()).toBe(tid);
      expect(isBypassTenant()).toBe(false);
    });
  });

  it('runWithTenant bypass=true marks bypass inside the callback', async () => {
    await runWithTenant(null, true, async () => {
      expect(getTenantId()).toBeNull();
      expect(isBypassTenant()).toBe(true);
    });
  });

  it('getTenantId is null again after the context exits', async () => {
    await runWithTenant(tenantAlpha.toString(), false, async () => {});
    expect(getTenantId()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('tenantPlugin – query isolation', () => {
  let Article;

  beforeAll(() => {
    Article = model('Article');
  });

  // Clean up between each test (global setup.js already handles this, but be explicit)
  afterEach(async () => {
    if (mongoose.models.Article) await mongoose.models.Article.deleteMany({});
  });

  it('auto-assigns tenantId on save within tenant context', async () => {
    await runWithTenant(tenantAlpha.toString(), false, async () => {
      const doc = await Article.create({ title: 'Alpha Doc' });
      expect(doc.tenantId.toString()).toBe(tenantAlpha.toString());
    });
  });

  it('does NOT auto-assign tenantId in bypass mode', async () => {
    await runWithTenant(null, true, async () => {
      const doc = await Article.create({ title: 'Global Doc', tenantId: tenantBeta });
      expect(doc.tenantId.toString()).toBe(tenantBeta.toString());
    });
  });

  it('find returns only documents for the active tenant', async () => {
    await runWithTenant(null, true, async () => {
      await Article.create([
        { title: 'Alpha 1', tenantId: tenantAlpha },
        { title: 'Alpha 2', tenantId: tenantAlpha },
        { title: 'Beta 1', tenantId: tenantBeta },
      ]);
    });

    await runWithTenant(tenantAlpha.toString(), false, async () => {
      const docs = await Article.find();
      expect(docs).toHaveLength(2);
      docs.forEach((d) => expect(d.tenantId.toString()).toBe(tenantAlpha.toString()));
    });

    await runWithTenant(tenantBeta.toString(), false, async () => {
      const docs = await Article.find();
      expect(docs).toHaveLength(1);
      expect(docs[0].title).toBe('Beta 1');
    });
  });

  it('findOne scopes correctly to active tenant', async () => {
    await runWithTenant(null, true, async () => {
      await Article.create({ title: 'Alpha Only', tenantId: tenantAlpha });
    });

    await runWithTenant(tenantBeta.toString(), false, async () => {
      const doc = await Article.findOne({ title: 'Alpha Only' });
      expect(doc).toBeNull();
    });

    await runWithTenant(tenantAlpha.toString(), false, async () => {
      const doc = await Article.findOne({ title: 'Alpha Only' });
      expect(doc).not.toBeNull();
    });
  });

  it('countDocuments scopes to active tenant', async () => {
    await runWithTenant(null, true, async () => {
      await Article.create([
        { title: 'A1', tenantId: tenantAlpha },
        { title: 'A2', tenantId: tenantAlpha },
        { title: 'B1', tenantId: tenantBeta },
      ]);
    });

    await runWithTenant(tenantAlpha.toString(), false, async () => {
      expect(await Article.countDocuments()).toBe(2);
    });

    await runWithTenant(tenantBeta.toString(), false, async () => {
      expect(await Article.countDocuments()).toBe(1);
    });
  });

  it('bypass mode returns all documents regardless of tenant', async () => {
    await runWithTenant(null, true, async () => {
      await Article.create([
        { title: 'A', tenantId: tenantAlpha },
        { title: 'B', tenantId: tenantBeta },
      ]);

      const docs = await Article.find();
      expect(docs).toHaveLength(2);
    });
  });

  it('updateOne scopes to active tenant', async () => {
    await runWithTenant(null, true, async () => {
      await Article.create([
        { title: 'Shared', tenantId: tenantAlpha },
        { title: 'Shared', tenantId: tenantBeta },
      ]);
    });

    await runWithTenant(tenantAlpha.toString(), false, async () => {
      await Article.updateOne({ title: 'Shared' }, { title: 'Alpha Updated' });
    });

    await runWithTenant(null, true, async () => {
      const alphaDoc = await Article.findOne({ tenantId: tenantAlpha });
      const betaDoc = await Article.findOne({ tenantId: tenantBeta });
      expect(alphaDoc.title).toBe('Alpha Updated');
      expect(betaDoc.title).toBe('Shared');
    });
  });

  it('deleteOne scopes to active tenant', async () => {
    await runWithTenant(null, true, async () => {
      await Article.create([
        { title: 'To Delete', tenantId: tenantAlpha },
        { title: 'To Delete', tenantId: tenantBeta },
      ]);
    });

    await runWithTenant(tenantAlpha.toString(), false, async () => {
      await Article.deleteOne({ title: 'To Delete' });
    });

    await runWithTenant(null, true, async () => {
      const remaining = await Article.find({ title: 'To Delete' });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].tenantId.toString()).toBe(tenantBeta.toString());
    });
  });

  it('aggregate prepends $match for active tenantId', async () => {
    await runWithTenant(null, true, async () => {
      await Article.create([
        { title: 'A1', tenantId: tenantAlpha },
        { title: 'A2', tenantId: tenantAlpha },
        { title: 'B1', tenantId: tenantBeta },
      ]);
    });

    await runWithTenant(tenantAlpha.toString(), false, async () => {
      const results = await Article.aggregate([{ $project: { title: 1, tenantId: 1 } }]);
      expect(results).toHaveLength(2);
      results.forEach((r) => expect(r.tenantId.toString()).toBe(tenantAlpha.toString()));
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('tenantPlugin – skipTenant schema option', () => {
  let GlobalArticle;

  beforeAll(() => {
    GlobalArticle = model('GlobalArticle', { skipTenant: true });
  });

  afterEach(async () => {
    if (mongoose.models.GlobalArticle) await mongoose.models.GlobalArticle.deleteMany({});
  });

  it('should NOT add tenantId field when skipTenant: true', () => {
    const paths = Object.keys(GlobalArticle.schema.paths);
    expect(paths).not.toContain('tenantId');
  });

  it('find returns all documents regardless of tenant context', async () => {
    await GlobalArticle.create([{ title: 'G1' }, { title: 'G2' }]);

    await runWithTenant(tenantAlpha.toString(), false, async () => {
      const docs = await GlobalArticle.find();
      expect(docs).toHaveLength(2);
    });
  });
});
