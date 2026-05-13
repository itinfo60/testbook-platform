import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TeacherQuizForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', courseId: '', questions: [] });

  const handleSubmit = e => {
    e.preventDefault();
    toast.success('Quiz form - connect to API');
    navigate('/teacher/quizzes');
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">Create New Quiz</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <Input label="Quiz Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
          <Input label="Course ID" value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })} />
        </div>
        <div className="flex gap-3">
          <Button type="submit">Create Quiz</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher/quizzes')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
