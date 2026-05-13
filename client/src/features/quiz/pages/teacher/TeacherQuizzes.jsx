import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiPlus } from 'react-icons/hi';
import { fetchTeacherQuizzes } from '@/features/quiz/quizSlice';

export default function TeacherQuizzes() {
  const dispatch = useDispatch();
  const { teacherQuizzes, loading } = useSelector(state => state.quizzes);

  useEffect(() => {
    dispatch(fetchTeacherQuizzes());
  }, [dispatch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white">My Quizzes</h2>
        <Link to="/teacher/quizzes/new"><Button icon={HiPlus} size="sm">Create Quiz</Button></Link>
      </div>
      {teacherQuizzes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🧩</div>
          <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
          <p className="text-dark-500 mb-4">Create quizzes for your courses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teacherQuizzes.map(quiz => (
            <div key={quiz._id} className="card p-4 flex items-center gap-4">
              <div className="text-2xl">🧩</div>
              <div className="flex-1">
                <h3 className="font-medium text-dark-900 dark:text-white">{quiz.title}</h3>
                <p className="text-xs text-dark-400">{quiz.questions?.length || 0} questions</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
