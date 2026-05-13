import fs from 'fs';
const base = process.cwd();
const adminPaths = [
  'admin/src/components/DataTable.jsx',
  'admin/src/features/user/pages/UserForm.jsx',
  'admin/src/features/category/pages/CategoryForm.jsx',
  'admin/src/features/examcategory/pages/ExamCategoryForm.jsx',
  'admin/src/features/coupon/pages/CouponForm.jsx'
];
adminPaths.forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace("import LoadingSpinner from '@/components/common/LoadingSpinner';", "import LoadingSpinner from '@/components/loadingSpinner';");
  fs.writeFileSync(p, c);
  console.log('Fixed', p);
});
