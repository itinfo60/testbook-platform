import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parentAPI } from '@/services/api';
import { Input, Button } from '@/components/ui';
import { HiUserGroup, HiAcademicCap, HiChartBar } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ParentDashboard() {
  const [students, setStudents] = useState([]);
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await parentAPI.getLinkedStudents();
      setStudents(data.data?.students || []);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    if (!accessCode || accessCode.length !== 6) {
      toast.error('Please enter a valid 6-digit access code');
      return;
    }

    setLinking(true);
    try {
      await parentAPI.linkStudent({ code: accessCode });
      toast.success('Student linked successfully!');
      setAccessCode('');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link student');
    } finally {
      setLinking(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Parent Portal</h1>
          <p className="text-dark-500">Monitor your children's learning progress</p>
        </div>
        <Link to="/messages" className="btn-primary flex items-center gap-2">
          Messages
        </Link>
      </div>

      {/* Link New Student */}
      <div className="card p-6 border border-dark-200 dark:border-dark-800">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2 mb-4">
          <HiUserGroup className="text-primary-500" /> Link a Student
        </h2>
        <form onSubmit={handleLink} className="flex gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Access Code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter 6-digit code provided by student"
              maxLength={6}
            />
          </div>
          <Button type="submit" variant="primary" loading={linking}>
            Link Student
          </Button>
        </form>
      </div>

      {/* Linked Students */}
      <h2 className="text-xl font-bold text-dark-900 dark:text-white mt-8 mb-4">My Students</h2>

      {students.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-800">
          <HiUserGroup className="h-16 w-16 text-dark-300 dark:text-dark-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">
            No students linked yet
          </h3>
          <p className="text-dark-500">
            Ask your child to generate an access code from their profile settings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div
              key={student._id}
              className="card p-6 hover:shadow-lg transition-all border border-dark-200 dark:border-dark-800"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xl font-bold text-primary-600">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-dark-900 dark:text-white">{student.name}</h3>
                  <p className="text-sm text-dark-500">{student.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                    <HiAcademicCap className="text-dark-400" /> Courses
                  </span>
                  <span className="font-medium text-dark-900 dark:text-white">
                    View Progress &rarr;
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                    <HiChartBar className="text-dark-400" /> Tests
                  </span>
                  <span className="font-medium text-dark-900 dark:text-white">
                    View Reports &rarr;
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-dark-100 dark:border-dark-800 pt-3 mt-3">
                  <span className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                    <HiUserGroup className="text-dark-400" /> Teachers
                  </span>
                  <Link
                    to={`/messages?studentId=${student._id}`}
                    className="font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Message Teachers &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
