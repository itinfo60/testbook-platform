import fs from 'fs';
const file =
  '/Users/balveerchoudhary/civicsedu-platform/server/src/modules/payment/payment.controller.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /if \(typeof courseId === 'string' && courseId.match\(\/\^\[0-9a-fA-F\]\{24\}\$\/\)\) \{\s*item = await Course.findById\(courseId\);\s*\}\s*if \(!item\) \{\s*item = await Course.findOne\(\{ slug: courseId \}\);\s*\}/g,
  `item = await prisma.course.findFirst({ where: { OR: [{ id: courseId }, { slug: courseId }] } });`
);
code = code.replace(
  /const existing = await Enrollment\.findOne\(\{\s*user: req.userId,\s*course: item\.id,\s*status: \{ \$in: \['active', 'completed'\] \},\s*\}\);/g,
  `const existing = await prisma.enrollment.findFirst({ where: { userId: req.userId, courseId: item.id, status: { in: ['active', 'completed'] } } });`
);
code = code.replace(
  /if \(typeof testId === 'string' && testId.match\(\/\^\[0-9a-fA-F\]\{24\}\$\/\)\) \{\s*item = await Test\.findById\(testId\);\s*\}\s*if \(!item\) \{\s*item = await Test\.findOne\(\{ slug: testId \}\);\s*\}\s*if \(!item\) \{\s*if \(typeof testId === 'string' && testId\.match\(\/\^\[0-9a-fA-F\]\{24\}\$\/\)\) \{\s*item = await TestSeries\.findById\(testId\);\s*\}\s*if \(!item\) \{\s*item = await TestSeries\.findOne\(\{ slug: testId \}\);\s*\}\s*\}/g,
  `item = await prisma.test.findFirst({ where: { OR: [{ id: testId }, { slug: testId }] } }); if (!item) item = await prisma.testSeries.findFirst({ where: { OR: [{ id: testId }, { slug: testId }] } });`
);
code = code.replace(
  /await Course\.findByIdAndUpdate\(item\.id, \{ \$inc: \{ enrollmentCount: 1 \} \}\);/g,
  `// enrollmentCount removed in Prisma`
);
code = code.replace(
  /await User\.findByIdAndUpdate\(req\.userId, \{ \$inc: \{ enrolledCourses: 1 \} \}\);/g,
  `// enrolledCourses logic handled elsewhere`
);

// Also fix getMyOrders and getOrders
code = code.replace(
  /const courses = await Course\.find\(/g,
  `const courses = await prisma.course.findMany(`
);
code = code.replace(/_id: \{ \$in: courseIds \},/g, `id: { in: courseIds },`);
code = code.replace(
  /const tests = await Test\.find\(/g,
  `const tests = await prisma.test.findMany(`
);
code = code.replace(
  /const testSeries = await TestSeries\.find\(/g,
  `const testSeries = await prisma.testSeries.findMany(`
);
code = code.replace(/_id: \{ \$in: testIds \},/g, `id: { in: testIds },`);
code = code.replace(/_id: \{ \$in: testSeriesIds \},/g, `id: { in: testSeriesIds },`);

fs.writeFileSync(file, code);
console.log('Fixed payment.controller.ts');
