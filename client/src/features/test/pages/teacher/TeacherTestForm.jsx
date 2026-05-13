import { Input } from '@/components/ui';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createTest, updateTest, fetchTestById } from '@/features/test/testSlice';
import toast from 'react-hot-toast';

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
    if (isEdit) dispatch(fetchTestById(id));
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentTest) {
      setFormData({
        title: currentTest.title || '',
        description: currentTest.description || '',
        duration: currentTest.duration || 60,
        category: currentTest.category || '',
        difficulty: currentTest.difficulty || 'medium',
        questions: currentTest.questions || [],
      });
    }
  }, [isEdit, currentTest]);

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
    });
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
    try {
      if (isEdit) {
        await dispatch(updateTest({ id, ...formData })).unwrap();
        toast.success('Test updated!');
      } else {
        await dispatch(createTest(formData)).unwrap();
        toast.success('Test created!');
      }
      navigate('/teacher/tests');
    } catch (err) {
      toast.error(err || 'Failed');
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
          <div className="grid grid-cols-3 gap-4">
            <Input label="Duration (min)" type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
            <Input label="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-500">Question {qi + 1}</span>
                  <button type="button" onClick={() => removeQuestion(qi)} className="text-red-500"><HiTrash className="h-4 w-4" /></button>
                </div>
                <textarea placeholder="Question text" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} className="input-field min-h-[60px] resize-none text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, 'correctAnswer', oi)} className="text-primary-600" />
                      <input placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} className="input-field text-sm" />
                    </div>
                  ))}
                </div>
                <input placeholder="Explanation (optional)" value={q.explanation} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} className="input-field text-sm" />
              </div>
            ))}
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
