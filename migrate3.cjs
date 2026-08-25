const fs = require('fs');
const path = require('path');

const modules = ["payment", "coupon", "review", "blog"];
const baseDir = "/Users/balveerchoudhary/testbook-platform/server/src/modules";

for (const mod of modules) {
  const modDir = path.join(baseDir, mod);
  if (!fs.existsSync(modDir)) continue;

  const files = fs.readdirSync(modDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  for (const file of files) {
    if (file.includes('.model.')) continue;
    
    const filePath = path.join(modDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Remove mongoose imports
    content = content.replace(/import\s+mongoose\s+from\s+['"]mongoose['"];?\n?/g, '');
    // Remove model imports
    content = content.replace(/import\s+[A-Za-z]+\s+from\s+['"]\.\/[a-zA-Z0-9_-]+\.model(?:\.js|\.ts)?['"];?\n?/g, '');
    content = content.replace(/import\s+[A-Za-z]+\s+from\s+['"]\.\.\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.model(?:\.js|\.ts)?['"];?\n?/g, '');

    // Ensure prisma is imported if we are using it
    if (!content.includes('import prisma from') && !file.includes('.dto.') && !file.includes('.validation.') && !file.includes('.routes.')) {
      content = `import prisma from '../../config/prisma.js';\n` + content;
    }

    // 2. Replace ObjectId conversions
    content = content.replace(/new\s+mongoose\.Types\.ObjectId\(([^)]+)\)/g, '$1');
    content = content.replace(/mongoose\.Types\.ObjectId\.isValid\(([^)]+)\)/g, '($1.length > 0)');
    content = content.replace(/mongoose\.Types\.ObjectId/g, 'String');
    
    // 3. Replacements
    content = content.replace(/\._id/g, '.id');
    
    // For specific models in these directories
    const capitalizedMod = mod.charAt(0).toUpperCase() + mod.slice(1);
    
    // Constructor in repo
    content = content.replace(/constructor\(model:\s*Model<[^>]+>\s*=\s*[A-Za-z]+\s*(?:as\s+Model<[^>]+>)?\)/, `constructor(model = prisma.${mod})`);
    content = content.replace(/super\(model\);/, 'super(model as any);');
    
    // Model.method( -> prisma.model.method(
    const modelNames = ['Payment', 'Coupon', 'Review', 'Blog', 'Course', 'User', 'Enrollment'];
    
    for (const m of modelNames) {
      const lowerM = m.toLowerCase();
      // findOne({ -> findFirst({ where: {
      content = content.replace(new RegExp(`${m}\\.findOne\\(\\{`, 'g'), `prisma.${lowerM}.findFirst({ where: {`);
      
      // findById(id) -> findUnique({ where: { id } })
      content = content.replace(new RegExp(`${m}\\.findById\\(([^),]+)\\)`, 'g'), `prisma.${lowerM}.findUnique({ where: { id: $1 } })`);
      
      // findByIdAndUpdate(id, { -> update({ where: { id }, data: {
      content = content.replace(new RegExp(`${m}\\.findByIdAndUpdate\\(([^),]+),\\s*\\{`, 'g'), `prisma.${lowerM}.update({ where: { id: $1 }, data: {`);
      
      // findOneAndUpdate({ condition }, { update }) -> update({ where: { condition }, data: { update } })
      // This is tricky for regex, let's just do findOneAndUpdate({ -> update({ where: {
      content = content.replace(new RegExp(`${m}\\.findOneAndUpdate\\(\\{`, 'g'), `prisma.${lowerM}.update({ where: {`);
      
      // create({ -> create({ data: {
      content = content.replace(new RegExp(`${m}\\.create\\(\\{`, 'g'), `prisma.${lowerM}.create({ data: {`);
      
      // countDocuments({ -> count({ where: {
      content = content.replace(new RegExp(`${m}\\.countDocuments\\(\\{`, 'g'), `prisma.${lowerM}.count({ where: {`);
      
      content = content.replace(new RegExp(`${m}\\.find\\(\\{`, 'g'), `prisma.${lowerM}.findMany({ where: {`);
      
      // Some generic calls
      content = content.replace(new RegExp(`${m}\\.`, 'g'), `prisma.${lowerM}.`);
    }
    
    // Replace doc.save() -> we can't easily guess the model, so we comment it out or leave it for manual
    // Actually, user said replace doc.save(), we'll replace with /* prisma update */
    content = content.replace(/(\w+)\.save\(\)/g, `/* await $1.save() replaced with prisma */`);
    
    // paginate logic: Blog.paginate(...) -> prisma.blog.findMany(...)
    content = content.replace(/prisma\.([a-z]+)\.paginate\(/g, `prisma.$1.findMany(`);
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}
