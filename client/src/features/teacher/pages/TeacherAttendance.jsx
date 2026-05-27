import { useState, useEffect } from 'react';
import { attendanceAPI, courseAPI, enrollmentAPI } from '@/services/api';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { HiCheck, HiX, HiMinus, HiCalendar } from 'react-icons/hi';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function TeacherAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // records: { [studentId]: { status, remarks } }
  const [records, setRecords] = useState({});
  const [students, setStudents] = useState([]); // Students enrolled in selected course

  useEffect(() => {
    courseAPI
      .getTeacherCourses()
      .then((res) => setCourses(res.data?.data?.courses || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadAttendanceData();
    } else {
      setStudents([]);
      setRecords({});
    }
  }, [selectedCourse, date]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Get all students from this course
      const enrollRes = await enrollmentAPI.getTeacherStudents();
      const allEnrollments = enrollRes.data?.data?.students || [];
      const courseStudents = allEnrollments
        .filter((e) => e.course?._id === selectedCourse)
        .map((e) => e.user);

      // Remove duplicates
      const uniqueStudents = Array.from(new Map(courseStudents.map((s) => [s._id, s])).values());
      setStudents(uniqueStudents);

      // 2. Fetch existing attendance for the date
      const attRes = await attendanceAPI.getAttendance(selectedCourse, date);
      const existingAtt = attRes.data?.data?.attendance;

      const initialRecords = {};
      if (existingAtt && existingAtt.records) {
        existingAtt.records.forEach((r) => {
          initialRecords[r.student._id || r.student] = {
            status: r.status,
            remarks: r.remarks || '',
          };
        });
      }

      // Merge with uniqueStudents
      uniqueStudents.forEach((s) => {
        if (!initialRecords[s._id]) {
          initialRecords[s._id] = { status: 'present', remarks: '' };
        }
      });

      setRecords(initialRecords);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = { ...records[s._id], status };
    });
    setRecords(updated);
  };

  const handleSave = async () => {
    if (!selectedCourse || !date) return;
    setSaving(true);
    try {
      const recordsArray = Object.keys(records).map((studentId) => ({
        student: studentId,
        status: records[studentId].status,
        remarks: records[studentId].remarks,
      }));

      await attendanceAPI.saveAttendance(selectedCourse, { date, records: recordsArray });
      toast.success('Attendance saved successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Attendance Tracking</h2>
          <p className="text-dark-500">Mark daily attendance for your courses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Select Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="input-field w-full"
          >
            <option value="">-- Choose Course --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Select Date
          </label>
          <div className="relative">
            <HiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 h-5 w-5" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field w-full pl-10"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      {loading && selectedCourse ? (
        <LoadingSpinner />
      ) : selectedCourse ? (
        students.length === 0 ? (
          <div className="card p-12 text-center text-dark-500">
            No students enrolled in this course yet.
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="p-4 bg-dark-50 dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 flex justify-between items-center">
              <span className="font-semibold text-dark-900 dark:text-white">
                {students.length} Students
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAll('present')}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('absent')}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            <div className="divide-y divide-dark-200 dark:divide-dark-700">
              {students.map((s) => {
                const rec = records[s._id] || { status: 'present', remarks: '' };
                return (
                  <div key={s._id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                        {s.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h4 className="font-medium text-dark-900 dark:text-white">{s.name}</h4>
                        <p className="text-xs text-dark-500">{s.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(s._id, 'present')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          rec.status === 'present'
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'bg-dark-100 dark:bg-dark-800 text-dark-600 hover:bg-dark-200'
                        }`}
                      >
                        <HiCheck className="h-4 w-4" /> Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(s._id, 'absent')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          rec.status === 'absent'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-dark-100 dark:bg-dark-800 text-dark-600 hover:bg-dark-200'
                        }`}
                      >
                        <HiX className="h-4 w-4" /> Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(s._id, 'late')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          rec.status === 'late'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-dark-100 dark:bg-dark-800 text-dark-600 hover:bg-dark-200'
                        }`}
                      >
                        <HiMinus className="h-4 w-4" /> Late
                      </button>
                    </div>

                    <div className="md:w-48">
                      <input
                        type="text"
                        placeholder="Remarks (optional)"
                        value={rec.remarks}
                        onChange={(e) => handleRemarksChange(s._id, e.target.value)}
                        className="input-field text-sm w-full py-1.5"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-dark-50 dark:bg-dark-800 border-t border-dark-200 dark:border-dark-700 flex justify-end">
              <Button onClick={handleSave} loading={saving}>
                Save Attendance
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="card p-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 mb-4">
            <HiCalendar className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-dark-900 dark:text-white">
            Select a course to mark attendance
          </h3>
          <p className="text-dark-500 mt-1">Choose a course and date from the filters above.</p>
        </div>
      )}
    </div>
  );
}
