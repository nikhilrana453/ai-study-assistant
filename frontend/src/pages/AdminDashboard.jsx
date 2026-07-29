import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: "", subject: "" });
  const [enrollForm, setEnrollForm] = useState({ userId: "", courseId: "" });
  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/admin/courses").then(r => setCourses(r.data)).catch(console.error);
    api.get("/admin/users").then(r => setUsers(r.data)).catch(console.error);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/admin/courses", newCourse);
      setCourses(prev => [...prev, res.data]);
      setNewCourse({ name: "", subject: "" });
      showToast("Course created successfully");
    } catch {
      showToast("Failed to create course", "error");
    } finally {
      setLoading(false);
    }
  };

  const enrollStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/enroll", enrollForm);
      setEnrollForm({ userId: "", courseId: "" });
      showToast("Student enrolled successfully");
      api.get("/admin/courses").then(r => setCourses(r.data));
    } catch {
      showToast("Failed to enroll student", "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "courses",  label: "Courses",  count: courses.length },
    { id: "students", label: "Students", count: users.length },
    { id: "enroll",   label: "Enroll",   count: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-green-50 border border-green-200 text-green-700"
        }`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            {toast.type === "error"
              ? <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            }
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Left: logo + title */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span className="hidden sm:block text-sm text-gray-500">AI Study Assistant</span>
          </div>

          {/* Right: upload button + user + sign out */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/upload")}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload materials
            </button>

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
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total courses</p>
            <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total students</p>
            <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
            <p className="text-sm text-gray-500 mb-1">Total enrollments</p>
            <p className="text-2xl font-semibold text-gray-900">
              {courses.reduce((a, c) => a + (c._count?.enrollments || 0), 0)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── COURSES TAB ── */}
        {activeTab === "courses" && (
          <div className="space-y-4">

            {/* Create course form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Create new course</h3>
              <form onSubmit={createCourse} className="flex flex-col sm:flex-row gap-3">
                <input
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Course name  (e.g. Studio 5)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <input
                  value={newCourse.subject}
                  onChange={e => setNewCourse({ ...newCourse, subject: e.target.value })}
                  placeholder="Subject  (optional)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                >
                  {loading ? "Creating..." : "Create course"}
                </button>
              </form>
            </div>

            {/* Courses list */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">All courses</h3>
                <span className="text-xs text-gray-400">{courses.length} total</span>
              </div>
              {courses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400">No courses yet. Create one above.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {courses.map(course => (
                    <div key={course.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{course.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{course.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2.5 py-1 rounded-full">
                          {course._count?.enrollments || 0} students
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2.5 py-1 rounded-full">
                          {course._count?.materials || 0} materials
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {activeTab === "students" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">All students</h3>
              <span className="text-xs text-gray-400">{users.length} total</span>
            </div>
            {users.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">No students registered yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-indigo-700">
                          {u.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      u.role === "ADMIN"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {u.role === "ADMIN" ? "Admin" : "Student"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ENROLL TAB ── */}
        {activeTab === "enroll" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 max-w-md">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Enroll a student</h3>
            <p className="text-xs text-gray-500 mb-4">
              Assign a student to a course so they can access the AI tutor for that course.
            </p>
            <form onSubmit={enrollStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Student</label>
                <select
                  value={enrollForm.userId}
                  onChange={e => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">Select student...</option>
                  {users.filter(u => u.role !== "ADMIN").map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Course</label>
                <select
                  value={enrollForm.courseId}
                  onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">Select course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Enrolling..." : "Enroll student"}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}