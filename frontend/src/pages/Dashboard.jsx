import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses/my-courses')
      .then((res) => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const icons = ['📘', '📗', '📙', '📕'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-gray-800">Study Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              👋 Hi, <strong>{user?.name}</strong>
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
          <p className="text-gray-500 mt-1">
            Select a course to start studying with AI assistance
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-gray-600 font-medium">No courses found</p>
            <p className="text-gray-400 text-sm mt-1">
              Contact your educator to get enrolled in a course
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course, i) => (
              <div
                key={course.id}
                onClick={() => navigate(`/chat/${course.id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-3xl">{icons[i % icons.length]}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                    {course.subject}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{course.description}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>Open Chat</span>
                  <span className="ml-1">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}