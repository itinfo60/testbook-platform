import fs from 'fs';

const fixes = [
  { file: 'src/features/course/pages/teacher/TeacherCourseForm.jsx', imports: ['import { HiPlus, HiTrash } from "react-icons/hi";', 'import { Button } from "@/components/ui";'] },
  { file: 'src/features/course/pages/teacher/TeacherCourses.jsx', imports: ['import LoadingSpinner from "@/components/common/LoadingSpinner";', 'import { Link } from "react-router-dom";', 'import { Button } from "@/components/ui";', 'import { HiEye, HiPencil } from "react-icons/hi";'] },
  { file: 'src/features/enrollment/pages/checkout/CheckoutSuccess.jsx', imports: ['import { Link } from "react-router-dom";', 'import { HiCheckCircle, HiArrowRight } from "react-icons/hi";'] },
  { file: 'src/features/enrollment/pages/orders/OrderHistory.jsx', imports: ['import { Link } from "react-router-dom";'] },
  { file: 'src/features/home/pages/NotFoundPage.jsx', imports: ['import { Link } from "react-router-dom";', 'import { HiHome } from "react-icons/hi";'] },
  { file: 'src/features/leaderboard/pages/LeaderboardPage.jsx', imports: ['import Tabs from "@/components/common/Tabs";', 'import { HiTrendingUp } from "react-icons/hi";', 'import LoadingSpinner from "@/components/common/LoadingSpinner";'] },
  { file: 'src/features/notification/components/NotificationDropdown.jsx', imports: ['import { Link } from "react-router-dom";'] },
  { file: 'src/features/quiz/components/QuizResults.jsx', imports: ['import { HiCheckCircle, HiXCircle } from "react-icons/hi";'] },
  { file: 'src/features/quiz/components/QuizTimer.jsx', imports: ['import { HiClock } from "react-icons/hi";'] },
  { file: 'src/features/quiz/pages/QuizPage.jsx', imports: ['import QuizResults from "@/features/quiz/components/QuizResults";', 'import QuizTimer from "@/features/quiz/components/QuizTimer";', 'import QuizQuestion from "@/features/quiz/components/QuizQuestion";', 'import { Button } from "@/components/ui";'] },
  { file: 'src/features/quiz/pages/teacher/TeacherQuizForm.jsx', imports: ['import { Input, Button } from "@/components/ui";'] },
  { file: 'src/features/quiz/pages/teacher/TeacherQuizzes.jsx', imports: ['import { Link } from "react-router-dom";', 'import { Button } from "@/components/ui";'] },
  { file: 'src/features/teacher/pages/TeacherLayout.jsx', imports: ['import { Link, NavLink, Outlet } from "react-router-dom";', 'import { HiArrowLeft } from "react-icons/hi";'] },
  { file: 'src/features/test/components/QuestionReview.jsx', imports: ['import { HiCheckCircle, HiXCircle } from "react-icons/hi";'] },
  { file: 'src/features/test/components/TestQuestion.jsx', imports: ['import { HiBookmark, HiArrowLeft, HiArrowRight } from "react-icons/hi";'] },
  { file: 'src/features/test/components/TestResultSummary.jsx', imports: ['import { Link } from "react-router-dom";', 'import { HiMinusCircle, HiCheckCircle, HiXCircle } from "react-icons/hi";'] },
  { file: 'src/features/test/components/TestTimer.jsx', imports: ['import { HiClock } from "react-icons/hi";'] },
  { file: 'src/features/test/pages/MyTestAttempts.jsx', imports: ['import { Link } from "react-router-dom";'] },
  { file: 'src/features/test/pages/TestResult.jsx', imports: ['import Tabs from "@/components/common/Tabs";', 'import TestResultSummary from "@/features/test/components/TestResultSummary";', 'import QuestionReview from "@/features/test/components/QuestionReview";'] },
  { file: 'src/features/test/pages/TestTaking.jsx', imports: ['import LoadingSpinner from "@/components/common/LoadingSpinner";', 'import { Button } from "@/components/ui";', 'import TestTimer from "@/features/test/components/TestTimer";', 'import TestQuestion from "@/features/test/components/TestQuestion";', 'import TestNavigator from "@/features/test/components/TestNavigator";'] },
  { file: 'src/features/test/pages/teacher/TeacherTestAnalytics.jsx', imports: ['import LoadingSpinner from "@/components/common/LoadingSpinner";'] },
  { file: 'src/features/test/pages/teacher/TeacherTestForm.jsx', imports: ['import { Input, Button } from "@/components/ui";', 'import { HiPlus, HiTrash } from "react-icons/hi";'] },
  { file: 'src/features/test/pages/teacher/TeacherTests.jsx', imports: ['import LoadingSpinner from "@/components/common/LoadingSpinner";', 'import { Link } from "react-router-dom";', 'import { Button } from "@/components/ui";', 'import { HiChartBar, HiPencil } from "react-icons/hi";'] },
  { file: 'src/features/wishlist/pages/Wishlist.jsx', imports: ['import LoadingSpinner from "@/components/common/LoadingSpinner";', 'import { Link } from "react-router-dom";', 'import CourseCard from "@/features/course/components/CourseCard";'] },
];

for (const { file, imports } of fixes) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const importStr = imports.join('\n') + '\n';
    content = importStr + content;
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  } catch (err) {
    console.error(`Error with ${file}`, err);
  }
}
