const fs = require('fs');
const path = require('path');

const mappings = {
  'authSlice': 'auth/authSlice',
  'courseSlice': 'course/courseSlice',
  'testSlice': 'test/testSlice',
  'quizSlice': 'quiz/quizSlice',
  'enrollmentSlice': 'enrollment/enrollmentSlice',
  'paymentSlice': 'payment/paymentSlice',
  'reviewSlice': 'review/reviewSlice',
  'notificationSlice': 'notification/notificationSlice',
  'wishlistSlice': 'wishlist/wishlistSlice',
  'discussionSlice': 'discussion/discussionSlice',
  'noteSlice': 'note/noteSlice',
  'categorySlice': 'category/categorySlice',
  'leaderboardSlice': 'leaderboard/leaderboardSlice',
  'achievementSlice': 'achievement/achievementSlice',
  'userSlice': 'user/userSlice',
  'couponSlice': 'coupon/couponSlice',
  'dashboardSlice': 'dashboard/dashboardSlice',
  'revenueSlice': 'revenue/revenueSlice',
  'teacherSlice': 'teacher/teacherSlice',
  'examCategorySlice': 'examcategory/examCategorySlice',
};

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

const roots = ['client/src', 'admin/src'];

roots.forEach(root => {
  walk(root, (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix various slice import patterns
    for (const [sliceName, correctSubPath] of Object.entries(mappings)) {
      const regex = new RegExp(`@/features/(?:[^/]+/)*(?:store/slices/)?${sliceName}`, 'g');
      content = content.replace(regex, `@/features/${correctSubPath}`);
    }

    // Standardize hooks: @/features/.../hooks/ -> @/hooks/
    content = content.replace(/@\/features\/(?:[^/]+\/)*hooks\//g, '@/hooks/');

    // Standardize utils: @/features/utils -> @/utils
    // Standardize utils: @/features/.../utils -> @/utils
    content = content.replace(/@\/features\/(?:[^/]+\/)*utils/g, '@/utils');

    // Standardize API imports
    content = content.replace(/@\/features\/services\/api/g, '@/services/api');

    if (content !== original) {
      console.log(`Updated imports in: ${filePath}`);
      fs.writeFileSync(filePath, content);
    }
  });
});
