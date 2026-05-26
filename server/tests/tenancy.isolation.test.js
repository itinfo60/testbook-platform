/**
 * Multi-tenancy isolation tests.
 * Verifies that Tenant A cannot access Tenant B's data under ANY circumstance.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { runWithTenant } from '../src/utils/TenantContext.js';
import Course from '../src/modules/course/course.model.js';
const tenantA = new mongoose.Types.ObjectId();
const tenantB = new mongoose.Types.ObjectId();

describe('Multi-tenancy isolation', () => {
  beforeEach(async () => {
    // Seed data for Tenant A
    await runWithTenant(tenantA.toString(), false, async () => {
      await Course.create({
        title: 'Physics for Tenant A',
        description: 'Tenant A physics course — 25 chars min',
        teacher: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
        slug: 'physics-tenant-a',
        sections: [],
      });
    });

    // Seed data for Tenant B
    await runWithTenant(tenantB.toString(), false, async () => {
      await Course.create({
        title: 'Math for Tenant B',
        description: 'Tenant B mathematics course — 25 chars min',
        teacher: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
        slug: 'math-tenant-b',
        sections: [],
      });
    });
  });

  it('Tenant A sees only their own courses', async () => {
    const courses = await runWithTenant(tenantA.toString(), false, () => Course.find({}));
    expect(courses).toHaveLength(1);
    expect(courses[0].title).toBe('Physics for Tenant A');
  });

  it('Tenant B sees only their own courses', async () => {
    const courses = await runWithTenant(tenantB.toString(), false, () => Course.find({}));
    expect(courses).toHaveLength(1);
    expect(courses[0].title).toBe('Math for Tenant B');
  });

  it('Tenant A count excludes Tenant B data', async () => {
    const count = await runWithTenant(tenantA.toString(), false, () => Course.countDocuments({}));
    expect(count).toBe(1);
  });

  it('findOne by title cannot find cross-tenant record', async () => {
    const course = await runWithTenant(tenantA.toString(), false, () =>
      Course.findOne({ title: 'Math for Tenant B' })
    );
    expect(course).toBeNull();
  });

  it('findById with wrong tenant returns null', async () => {
    // Get Tenant B's course ID
    const tenantBCourse = await runWithTenant(tenantB.toString(), false, () =>
      Course.findOne({ title: 'Math for Tenant B' })
    );
    expect(tenantBCourse).toBeTruthy();

    // Try to find it from Tenant A context
    const crossTenantResult = await runWithTenant(tenantA.toString(), false, () =>
      Course.findOne({ _id: tenantBCourse._id })
    );
    expect(crossTenantResult).toBeNull();
  });

  it('updateOne cannot modify cross-tenant records', async () => {
    const tenantBCourse = await runWithTenant(null, true, () =>
      Course.findOne({ title: 'Math for Tenant B' })
    );

    // Attempt update from Tenant A context
    const result = await runWithTenant(tenantA.toString(), false, () =>
      Course.updateOne({ _id: tenantBCourse._id }, { $set: { title: 'Hacked' } })
    );

    expect(result.modifiedCount).toBe(0);

    // Verify original is unchanged
    const unchanged = await runWithTenant(tenantB.toString(), false, () =>
      Course.findOne({ _id: tenantBCourse._id })
    );
    expect(unchanged.title).toBe('Math for Tenant B');
  });

  it('deleteOne cannot delete cross-tenant records', async () => {
    const tenantBCourse = await runWithTenant(null, true, () =>
      Course.findOne({ title: 'Math for Tenant B' })
    );

    // Attempt delete from Tenant A context
    const result = await runWithTenant(tenantA.toString(), false, () =>
      Course.deleteOne({ _id: tenantBCourse._id })
    );

    expect(result.deletedCount).toBe(0);

    // Verify still exists
    const stillExists = await runWithTenant(tenantB.toString(), false, () =>
      Course.findOne({ _id: tenantBCourse._id })
    );
    expect(stillExists).not.toBeNull();
  });

  it('bypass mode (super_admin) sees all records', async () => {
    const allCourses = await runWithTenant(null, true, () => Course.find({}));
    expect(allCourses.length).toBeGreaterThanOrEqual(2);
  });

  it('insertMany correctly assigns tenantId', async () => {
    await runWithTenant(tenantA.toString(), false, async () => {
      await Course.insertMany([
        {
          title: 'Chemistry Tenant A',
          description: 'Tenant A chemistry — more than 25 chars here',
          teacher: new mongoose.Types.ObjectId(),
          category: new mongoose.Types.ObjectId(),
          slug: 'chemistry-tenant-a',
          sections: [],
        },
      ]);
    });

    const coursesA = await runWithTenant(tenantA.toString(), false, () => Course.find({}));
    expect(coursesA.some((c) => c.title === 'Chemistry Tenant A')).toBe(true);

    // Tenant B should not see it
    const foundByB = await runWithTenant(tenantB.toString(), false, () =>
      Course.findOne({ title: 'Chemistry Tenant A' })
    );
    expect(foundByB).toBeNull();
  });

  it('aggregate pipeline is scoped by tenantId', async () => {
    const agg = await runWithTenant(tenantA.toString(), false, () =>
      Course.aggregate([{ $count: 'total' }])
    );
    // Tenant A has 2 courses after insertMany above
    expect(agg[0]?.total).toBe(2);

    const aggB = await runWithTenant(tenantB.toString(), false, () =>
      Course.aggregate([{ $count: 'total' }])
    );
    expect(aggB[0]?.total).toBe(1);
  });
});
