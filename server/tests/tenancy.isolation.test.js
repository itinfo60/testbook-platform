import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { runWithTenant } from '../src/utils/TenantContext.js';
import Course from '../src/modules/course/course.model.js';

const tenantA = new mongoose.Types.ObjectId();
const tenantB = new mongoose.Types.ObjectId();

describe('Multi-tenancy isolation', () => {
  it('validates tenant isolation across all operations', async () => {
    // 1. Seed data
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

    // 2. Read Isolation
    const coursesA = await runWithTenant(
      tenantA.toString(),
      false,
      async () => await Course.find({})
    );
    expect(coursesA).toHaveLength(1);
    expect(coursesA[0].title).toBe('Physics for Tenant A');

    const coursesB = await runWithTenant(
      tenantB.toString(),
      false,
      async () => await Course.find({})
    );
    expect(coursesB).toHaveLength(1);
    expect(coursesB[0].title).toBe('Math for Tenant B');

    const countA = await runWithTenant(
      tenantA.toString(),
      false,
      async () => await Course.countDocuments({})
    );
    expect(countA).toBe(1);

    const crossTenantByTitle = await runWithTenant(
      tenantA.toString(),
      false,
      async () => await Course.findOne({ title: 'Math for Tenant B' })
    );
    expect(crossTenantByTitle).toBeNull();

    // Get Tenant B's course directly to test findById
    const tenantBCourse = await runWithTenant(
      tenantB.toString(),
      false,
      async () => await Course.findOne({ title: 'Math for Tenant B' })
    );
    expect(tenantBCourse).toBeTruthy();

    const crossTenantById = await runWithTenant(
      tenantA.toString(),
      false,
      async () => await Course.findOne({ _id: tenantBCourse._id })
    );
    expect(crossTenantById).toBeNull();

    // 3. Update/Delete Isolation
    const updateResult = await runWithTenant(
      tenantA.toString(),
      false,
      async () => await Course.updateOne({ _id: tenantBCourse._id }, { $set: { title: 'Hacked' } })
    );
    expect(updateResult.modifiedCount).toBe(0);

    const deleteResult = await runWithTenant(
      tenantA.toString(),
      false,
      async () => await Course.deleteOne({ _id: tenantBCourse._id })
    );
    expect(deleteResult.deletedCount).toBe(0);

    // 4. Bypass Mode
    const allCourses = await runWithTenant(null, true, async () => await Course.find({}));
    expect(allCourses.length).toBeGreaterThanOrEqual(2);

    // 5. InsertMany and Aggregate
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

    const aggA = await runWithTenant(
      tenantA.toString(),
      false,
      async () => await Course.aggregate([{ $count: 'total' }])
    );
    expect(aggA[0]?.total).toBe(2);

    const aggB = await runWithTenant(
      tenantB.toString(),
      false,
      async () => await Course.aggregate([{ $count: 'total' }])
    );
    expect(aggB[0]?.total).toBe(1);
  });
});
