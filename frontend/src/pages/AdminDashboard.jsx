import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export default function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', subject: '', description: '' });
  const [enrollForm, setEnrollForm] = useState({ userId: '', courseId: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/courses').then((r) => setCourses(r.data));
    api.get('/admin/users').then((r) => setUsers(r.data.filter((u) => u.role === 'STUDENT')));
  }, []);

  const createCourse = async () => {
    if (!newCourse.name || !newCourse.subject) return;
    const res = await api.post('/admin/courses', newCourse);
    setCourses([...courses, res.data]);
    setNewCourse({ name: '', subject: '', description: '' });
    setMessage('Course created!');
  };

  const enrollStudent = async () => {
    if (!enrollForm.userId || !enrollForm.courseId) return;
    await api.post('/admin/enroll', enrollForm);
    setMessage('Student enrolled successfully!');
    setEnrollForm({ userId: '', courseId: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📚 Admin Panel</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/admin/upload')} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg">Upload Materials</button>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg">{message}</div>}

        {/* Create Course */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Create Course</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Course name" value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Subject" value={newCourse.subject}
              onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Description (optional)" value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={createCourse} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </section>

        {/* Enroll Student */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Enroll Student in Course</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={enrollForm.userId} onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Student</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
            <select value={enrollForm.courseId} onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={enrollStudent} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Enroll</button>
        </section>

        {/* Courses Table */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">All Courses</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Name</th><th className="pb-2">Subject</th>
              <th className="pb-2">Students</th><th className="pb-2">Materials</th>
            </tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{c.name}</td>
                  <td className="py-3 text-gray-500">{c.subject}</td>
                  <td className="py-3">{c._count?.enrollments ?? 0}</td>
                  <td className="py-3">{c._count?.materials ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}