import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

async function main() {
  console.log('Seeding minimal mock data...');

  const tenantId = '6a82a18008198c8684413371';
  const institute = await prisma.institute.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'CivicsHub Default Institute',
      subdomain: 'default',
    },
  });

  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@civicshub.com' },
    update: {},
    create: {
      email: 'admin@civicshub.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'super_admin',
      tenantId: institute.id,
    },
  });

  const studentPassword = await bcrypt.hash('Student@123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@civicshub.com' },
    update: {},
    create: {
      email: 'student@civicshub.com',
      name: 'Test Student',
      password: studentPassword,
      role: 'student',
      tenantId: institute.id,
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: 'engineering-entrance' },
    update: {},
    create: {
      name: 'Engineering Entrance',
      slug: 'engineering-entrance',
      tenantId: institute.id,
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: 'complete-system-design' },
    update: {},
    create: {
      title: 'Complete System Design',
      slug: 'complete-system-design',
      description: 'Learn system design from scratch',
      price: 999,
      teacherId: admin.id,
      tenantId: institute.id,
      categoryId: category.id,
      isPublished: true,
    },
  });

  console.log('✅ Seeding complete!');
  console.log('Admin:', admin.email);
  console.log('Student:', student.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
