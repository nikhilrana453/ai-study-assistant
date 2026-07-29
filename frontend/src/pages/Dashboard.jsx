import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/courses/my-courses")
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Colour palette for course cards
  const cardColors = [
    { bg: "bg-indigo-50", border: "border-indigo-200", icon: "bg-indigo-600", text: "text-indigo-700" },
    { bg: "bg-violet-50", border: "border-violet-200", icon: "bg-violet-600", text: "text-violet-700" },
    { bg: "bg-blue-50", border: "border-blue-200", icon: "bg-blue-600", text: "text-blue-700" },
    { bg: "bg-teal-50", border: "border-teal-200", icon: "bg-teal-600", text: "text-teal-700" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">AI Study Assistant</span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "ADMIN" && (
              <button
                onClick={() => navigate("/admin")}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Admin
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-indigo-700">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {courses.length > 0
              ? `You're enrolled in ${courses.length} course${courses.length > 1 ? "s" : ""}. Start a study session below.`
              : "No courses enrolled yet. Contact your admin to get started."}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No courses yet</h3>
            <p className="text-gray-500 text-sm">Ask your admin to enroll you in a course.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((enrollment, index) => {
              const course = enrollment.course || enrollment;
              const color = cardColors[index % cardColors.length];
              return (
                <button
                  key={course.id}
                  onClick={() => navigate(`/chat/${course.id}`)}
                  className={`${color.bg} ${color.border} border rounded-2xl p-5 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group`}
                >
                  <div className={`w-10 h-10 ${color.icon} rounded-xl flex items-center justify-center mb-4`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className={`font-semibold text-gray-900 mb-1 group-hover:${color.text} transition-colors`}>
                    {course.name}
                  </h3>
                  <p className="text-xs text-gray-500">{course.subject || "Start chatting with AI tutor"}</p>
                  <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${color.text}`}>
                    Open chat
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">AI answers from your lecture notes only</p>
            <p className="text-xs text-gray-500 mt-0.5">The AI tutor is trained exclusively on your uploaded course materials — not the internet.</p>
          </div>
        </div>
      </main>
    </div>
  );
}