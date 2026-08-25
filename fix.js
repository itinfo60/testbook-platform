import fs from 'fs';
const path =
  '/Users/balveerchoudhary/testbook-platform/client/src/features/course/pages/CourseDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /(course\.id \|\| course\.id \|\| course\._id)\.toString\(\)/g,
  '((course?.id || course?._id) || "").toString()'
);
content = content.replace(
  /course\.id \|\| course\._id\.toString\(\)/g,
  '((course?.id || course?._id) || "").toString()'
);
// Also clean up line 72: course: course.id || course._id
content = content.replace(/course: course\._id,/g, 'course: course.id || course._id,');
content = content.replace(
  /course: course\.id \|\| course\._id,/g,
  'course: course.id || course._id,'
);

fs.writeFileSync(path, content);
console.log('Fixed');
