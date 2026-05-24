import { Input } from '@/components/ui';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createTest, updateTest, fetchTestById, clearCurrentTest } from '@/features/test/testSlice';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { _id: '69d233db5fb0e25b31713a53', name: 'Banking' },
  { _id: '69d233db5fb0e25b31713a59', name: 'Defence' },
  { _id: '69d233db5fb0e25b31713a5a', name: 'Programming' },
  { _id: '69d233db5fb0e25b31713a55', name: 'Railways' },
  { _id: '69d233db5fb0e25b31713a54', name: 'SSC' },
  { _id: '69d233db5fb0e25b31713a57', name: 'State PSC' },
  { _id: '69d233db5fb0e25b31713a58', name: 'Teaching' },
  { _id: '69d233db5fb0e25b31713a56', name: 'UPSC' },
];

const normalizeQuestion = (q) => {
  // options may be [{text, isCorrect, _id}] objects or plain strings
  let options = ['', '', '', ''];
  let correctAnswer = 0;

  if (Array.isArray(q.options)) {
    if (q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null) {
      options = q.options.map(o => o.text || '');
      correctAnswer = q.options.findIndex(o => o.isCorrect === true);
      if (correctAnswer < 0) correctAnswer = 0;
    } else {
      options = q.options.map(o => String(o));
      correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
    }
  }

  return {
    question: q.question || q.text || '',
    options,
    correctAnswer,
    explanation: q.explanation || '',
    marks: q.marks || 1,
    negativeMark: q.negativeMark || 0,
  };
};

const blankQuestion = () => ({
  question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', marks: 1, negativeMark: 0,
});

export default function TeacherTestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTest, loading } = useSelector(state => state.tests);
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '', description: '', duration: 60, category: '', difficulty: 'medium', questions: [],
  });

  useEffect(() => {
    dispatch(clearCurrentTest());
    if (isEdit) dispatch(fetchTestById(id));
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentTest) {
      const categoryId = currentTest.category?._id || currentTest.category || '';
      setFormData({
        title: currentTest.title || '',
        description: currentTest.description || '',
        duration: currentTest.duration || 60,
        category: categoryId,
        difficulty: currentTest.difficulty || 'medium',
        questions: (currentTest.questions || []).map(normalizeQuestion),
      });
    }
  }, [isEdit, currentTest]);

  const addQuestion = () => {
    setFormData({ ...formData, questions: [...formData.questions, blankQuestion()] });
  };

  const updateQuestion = (qi, field, value) => {
    const updated = [...formData.questions];
    updated[qi] = { ...updated[qi], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const updateOption = (qi, oi, value) => {
    const updated = [...formData.questions];
    const options = [...updated[qi].options];
    options[oi] = value;
    updated[qi] = { ...updated[qi], options };
    setFormData({ ...formData, questions: updated });
  };

  const removeQuestion = qi => {
    setFormData({ ...formData, questions: formData.questions.filter((_, i) => i !== qi) });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.title) { toast.error('Title required'); return; }
    if (formData.questions.some(q => !q.question.trim())) {
      toast.error('All questions must have text'); return;
    }

    const payload = {
      ...formData,
      duration: Number(formData.duration),
      questions: formData.questions.map(q => ({
        question: q.question,
        options: q.options.map((text, i) => ({ text, isCorrect: i === q.correctAnswer })),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: Number(q.marks) || 1,
        negativeMark: Number(q.negativeMark) || 0,
      })),
    };

    try {
      if (isEdit) {
        await dispatch(updateTest({ id, ...payload })).unwrap();
        toast.success('Test updated!');
      } else {
        await dispatch(createTest(payload)).unwrap();
        toast.success('Test created!');
      }
      navigate('/teacher/tests');
    } catch (err) {
      toast.error(err?.message || err || 'Failed');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">{isEdit ? 'Edit Test' : 'Create New Test'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <Input label="Test Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field min-h-[80px] resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Duration (min)" type="number" min="1" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input-field">
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Difficulty</label>
              <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} className="input-field">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-dark-900 dark:text-white">Questions ({formData.questions.length})</h3>
            <button type="button" onClick={addQuestion} className="btn-outline text-sm flex items-center gap-1"><HiPlus className="h-3.5 w-3.5" /> Add Question</button>
          </div>
          <div className="space-y-4">
            {formData.questions.map((q, qi) => (
              <div key={qi} className="p-4 bg-dark-50 dark:bg-dark-800/50 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-dark-500">Question {qi + 1}</span>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-dark-400">Marks</label>
                      <input type="number" min="0" step="0.5" value={q.marks} onChange={e => updateQuestion(qi, 'marks', e.target.value)} className="input-field text-xs w-14 py-1" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-dark-400">-ve</label>
                      <input type="number" min="0" step="0.25" value={q.negativeMark} onChange={e => updateQuestion(qi, 'negativeMark', e.target.value)} className="input-field text-xs w-14 py-1" />
                    </div>
                    <button type="button" onClick={() => removeQuestion(qi)} className="text-red-500"><HiTrash className="h-4 w-4" /></button>
                  </div>
                </div>
                <textarea placeholder="Question text" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} className="input-field min-h-[60px] resize-none text-sm" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, 'correctAnswer', oi)} className="text-primary-600 flex-shrink-0" />
                      <input placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} className="input-field text-sm" />
                    </div>
                  ))}
                </div>
                <input placeholder="Explanation (optional)" value={q.explanation} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} className="input-field text-sm" />
              </div>
            ))}
            {formData.questions.length === 0 && (
              <div className="text-center py-8 text-dark-400 text-sm">No questions yet. Click "Add Question" to start.</div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>{isEdit ? 'Update Test' : 'Create Test'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher/tests')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
