const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const studio5 = await prisma.course.upsert({
    where: { id: 'course-studio5' },
    update: {},
    create: {
      id: 'course-studio5',
      name: 'Studio 5',
      subject: 'Software Engineering',
      description: 'Advanced software engineering project course'
    }
  });

  const studio6 = await prisma.course.upsert({
    where: { id: 'course-studio6' },
    update: {},
    create: {
      id: 'course-studio6',
      name: 'Studio 6',
      subject: 'Software Engineering',
      description: 'Capstone software engineering project course'
    }
  });

  const hash = (pw) => bcrypt.hash(pw, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@study.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@study.com', password: await hash('admin123'), role: 'ADMIN' }
  });

  const nikhil = await prisma.user.upsert({
    where: { email: 'nikhil@study.com' },
    update: {},
    create: { name: 'Nikhil', email: 'nikhil@study.com', password: await hash('student123') }
  });

  const harsh = await prisma.user.upsert({
    where: { email: 'harsh@study.com' },
    update: {},
    create: { name: 'Harsh', email: 'harsh@study.com', password: await hash('student123') }
  });

  // Both in Studio 5
  for (const userId of [nikhil.id, harsh.id]) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: studio5.id } },
      update: {},
      create: { userId, courseId: studio5.id }
    });
  }

  // Only Nikhil in Studio 6 — Harsh will get 403 (tests the gate)
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: nikhil.id, courseId: studio6.id } },
    update: {},
    create: { userId: nikhil.id, courseId: studio6.id }
  });

  console.log('✅ Seed complete!');
  console.log('  admin@study.com   / admin123');
  console.log('  nikhil@study.com  / student123  (Studio 5 + 6)');
  console.log('  harsh@study.com   / student123  (Studio 5 only)');
}

main().catch(console.error).finally(() => prisma.$disconnect());