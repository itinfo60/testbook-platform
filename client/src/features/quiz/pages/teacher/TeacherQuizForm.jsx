import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createQuiz, updateQuiz } from '@/features/quiz/quizSlice';
import { courseAPI, quizAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const normalizeQuestion = (q) => {
  let options = ['', '', '', ''];
  let correctAnswer = 0;
  if (Array.isArray(q.options) && q.options.length > 0) {
    if (typeof q.options[0] === 'object' && q.options[0] !== null) {
      options = q.options.map(o => o.text || '');
      const ci = q.options.findIndex(o => o.isCorrect === true);
      correctAnswer = ci >= 0 ? ci : 0;
    } else {
      options = q.options.map(o => String(o));
      correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
    }
  }
  return { question: q.question || '', options, correctAnswer, explanation: q.explanation || '' };
};

const blankQuestion = () => ({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });

export default function TeacherQuizForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: saving } = useSelector(state => state.quizzes);
  const isEdit = !!id;

  const [courses, setCourses] = useState([]);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [formData, setFormData] = useState({
    title: '', courseId: '', passingScore: 60, questions: [],
  });

  // Load teacher's courses
  useEffect(() => {
    courseAPI.getTeacherCourses()
      .then(res => {
        const data = res.data?.data;
        setCourses(Array.isArray(data) ? data : data?.courses || []);
      })
      .catch(() => {});
  }, []);

  // Load quiz directly via API — no Redux state dependency
  useEffect(() => {
    if (!isEdit) return;
    setPageLoading(true);
    quizAPI.getById(id)
      .then(res => {
        const quiz = res.data?.data?.quiz || res.data?.data;
        if (!quiz) { toast.error('Quiz not found'); return; }
        setFormData({
          title: quiz.title || '',
          courseId: quiz.course?._id || (typeof quiz.course === 'string' ? quiz.course : ''),
          passingScore: quiz.passingScore ?? 60,
          questions: (quiz.questions || []).map(normalizeQuestion),
        });
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.message || 'Failed to load quiz';
        toast.error(msg);
      })
      .finally(() => setPageLoading(false));
  }, [id, isEdit]);

  const addQuestion = () =>
    setFormData(f => ({ ...f, questions: [...f.questions, blankQuestion()] }));

  const updateQuestion = (qi, field, value) =>
    setFormData(f => {
      const qs = [...f.questions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...f, questions: qs };
    });

  const updateOption = (qi, oi, value) =>
    setFormData(f => {
      const qs = [...f.questions];
      const opts = [...qs[qi].options];
      opts[oi] = value;
      qs[qi] = { ...qs[qi], options: opts };
      return { ...f, questions: qs };
    });

  const removeQuestion = qi =>
    setFormData(f => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Title required'); return; }
    if (!formData.courseId) { toast.error('Please select a course'); return; }

    const payload = {
      title: formData.title,
      course: formData.courseId,
      passingScore: Number(formData.passingScore),
      questions: formData.questions.map(q => ({
        question: q.question,
        options: q.options.map((text, i) => ({ text, isCorrect: i === q.correctAnswer })),
        explanation: q.explanation,
      })),
    };

    try {
      if (isEdit) {
        await dispatch(updateQuiz({ id, ...payload })).unwrap();
        toast.success('Quiz updated!');
      } else {
        await dispatch(createQuiz(payload)).unwrap();
        toast.success('Quiz created!');
      }
      navigate('/teacher/quizzes');
    } catch (err) {
      toast.error(err?.message || err || 'Failed to save quiz');
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">
        {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <Input
            label="Quiz Title"
            value={formData.title}
            onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Course</label>
              <select
                value={formData.courseId}
                onChange={e => setFormData(f => ({ ...f, courseId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            <Input
              label="Passing Score (%)"
              type="number"
              min="0"
              max="100"
              value={formData.passingScore}
              onChange={e => setFormData(f => ({ ...f, passingScore: e.target.value }))}
            />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-dark-900 dark:text-white">
              Questions ({formData.questions.length})
            </h3>
            <button
              type="button"
              onClick={addQuestion}
              className="btn-outline text-sm flex items-center gap-1"
            >
              <HiPlus className="h-3.5 w-3.5" /> Add Question
            </button>
          </div>

          <div className="space-y-4">
            {formData.questions.length === 0 ? (
              <div className="text-center py-8 text-dark-400 text-sm">
                No questions yet. Click "Add Question" to start.
              </div>
            ) : formData.questions.map((q, qi) => (
              <div key={qi} className="p-4 bg-dark-50 dark:bg-dark-800/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-500">Question {qi + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  placeholder="Question text"
                  value={q.question}
                  onChange={e => updateQuestion(qi, 'question', e.target.value)}
                  className="input-field min-h-[60px] resize-none text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                        className="text-primary-600 flex-shrink-0"
                        title="Mark as correct answer"
                      />
                      <input
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  ))}
                </div>
                <input
                  placeholder="Explanation (optional)"
                  value={q.explanation}
                  onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            {isEdit ? 'Update Quiz' : 'Create Quiz'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher/quizzes')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
