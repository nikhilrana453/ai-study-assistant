import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCourseId, setUploadCourseId] = useState('');

  // ── Fetch stats ────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      setMessage(`❌ Error loading stats: ${err.message}`);
    }
  };

  // ── Fetch all courses ──────────────────────────────────────
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data.courses);
      setMessage('✅ Courses loaded');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Fetch course details (materials + enrollments) ────────────
  const fetchCourseDetails = async (courseId) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/course/${courseId}`);
      setSelectedCourse(response.data.course);

      const materialsRes = await api.get(`/admin/course/${courseId}/materials`);
      setCourseMaterials(materialsRes.data.materials);
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Fetch enrollments ──────────────────────────────────────
  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/enrollments');
      setEnrollments(response.data.enrollments);
      setMessage('✅ Enrollments loaded');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Delete course ──────────────────────────────────────
  const deleteCourse = async (courseId) => {
    if (!window.confirm('⚠️ This will delete the entire course, all materials, and enrollments. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.delete(`/admin/course/${courseId}`);
      setMessage(`✅ ${response.data.message}`);
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Edit course ────────────────────────────────────────
  const updateCourse = async (courseId, courseData) => {
    setLoading(true);
    try {
      const response = await api.put(`/admin/course/${courseId}`, courseData);
      setMessage(`✅ ${response.data.message}`);
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Delete material ────────────────────────────────────────
  const deleteMaterial = async (materialId) => {
    if (!window.confirm('⚠️ Delete this material and all its chunks?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.delete(`/admin/material/${materialId}`);
      setMessage(`✅ ${response.data.message}`);
      if (selectedCourse) {
        fetchCourseDetails(selectedCourse.id);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Delete enrollment (remove student) ──────────────────────────
  const deleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('⚠️ Remove this student from the course?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.delete(`/admin/enrollment/${enrollmentId}`);
      setMessage(`✅ ${response.data.message}`);
      fetchEnrollments();
      if (selectedCourse) {
        fetchCourseDetails(selectedCourse.id);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Upload material ────────────────────────────────────────
  const handleUploadMaterial = async () => {
    if (!uploadFile || !uploadCourseId) {
      setMessage('❌ Please select both a course and a file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('courseId', uploadCourseId);
    formData.append('title', uploadFile.name);

    try {
      const response = await api.post('/admin/material/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`✅ ${response.data.message || 'Material uploaded successfully'}`);
      setUploadFile(null);
      setUploadCourseId('');
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Upload failed: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Load initial data ──────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'courses') fetchCourses();
    if (activeTab === 'enrollments') fetchEnrollments();
  }, [activeTab]);

  return (
    <div className="admin-dashboard-container">
      {/* Navbar */}
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <div className="admin-navbar-left">
            <button onClick={() => navigate('/')} className="admin-nav-btn">
              ← Home
            </button>
            <span className="admin-nav-divider">|</span>
            <span className="admin-navbar-title">🛠️ Admin Dashboard</span>
          </div>
          <div className="admin-navbar-right">
            <button onClick={() => navigate('/analytics')} className="admin-nav-btn admin-nav-accent">
              📊 Analytics
            </button>
            <button onClick={logout} className="admin-nav-btn admin-nav-logout">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Message Alert */}
      {message && (
        <div className="admin-message">
          <div className="admin-message-content">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="admin-message-close">✕</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="admin-main">
        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`admin-tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 Courses
          </button>
          <button
            className={`admin-tab ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            📄 Materials
          </button>
          <button
            className={`admin-tab ${activeTab === 'enrollments' ? 'active' : ''}`}
            onClick={() => setActiveTab('enrollments')}
          >
            👥 Enrollments
          </button>
        </div>

        {/* Loading */}
        {loading && <div className="admin-loading">⏳ Loading...</div>}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="admin-tab-content">
            <h2>Dashboard Overview</h2>
            <div className="admin-stats-grid">
              {[
                { label: 'Total Users', value: stats.users, icon: '👥' },
                { label: 'Courses', value: stats.courses, icon: '📚' },
                { label: 'Enrollments', value: stats.enrollments, icon: '📝' },
                { label: 'Materials', value: stats.materials, icon: '📄' },
                { label: 'Document Chunks', value: stats.chunks, icon: '🔍' },
                { label: 'Chat Sessions', value: stats.chatSessions, icon: '💬' },
                { label: 'Messages', value: stats.messages, icon: '💭' },
                { label: 'Bookmarks', value: stats.bookmarks, icon: '🔖' },
              ].map((stat, i) => (
                <div key={i} className="admin-stat-card">
                  <div className="admin-stat-icon">{stat.icon}</div>
                  <div className="admin-stat-number">{stat.value}</div>
                  <div className="admin-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && !selectedCourse && (
          <div className="admin-tab-content">
            <h2>Manage Courses</h2>
            {courses.length === 0 ? (
              <p>No courses found</p>
            ) : (
              <div className="admin-courses-list">
                {courses.map(course => (
                  <div key={course.id} className="admin-course-card">
                    <div className="admin-course-info">
                      <h3>{course.name}</h3>
                      <p className="admin-subject">{course.subject}</p>
                      <p className="admin-description">{course.description}</p>
                      <div className="admin-course-stats">
                        <span>👥 {course.studentCount} students</span>
                        <span>📄 {course.materialCount} materials</span>
                        <span>📅 {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="admin-course-actions">
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => fetchCourseDetails(course.id)}
                      >
                        View Details
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => setEditingCourse(course)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => deleteCourse(course.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COURSE DETAILS */}
        {activeTab === 'courses' && selectedCourse && (
          <div className="admin-tab-content">
            <button
              className="admin-btn-back"
              onClick={() => { setSelectedCourse(null); setCourseMaterials([]); }}
            >
              ← Back to Courses
            </button>
            <h2>{selectedCourse.name}</h2>

            {/* Enrolled Students */}
            <div className="admin-section">
              <h3>👥 Enrolled Students ({selectedCourse.enrollments.length})</h3>
              {selectedCourse.enrollments.length === 0 ? (
                <p>No students enrolled</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourse.enrollments.map(e => (
                      <tr key={e.id}>
                        <td>{e.user.name}</td>
                        <td>{e.user.email}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn-small admin-btn-danger"
                            onClick={() => deleteEnrollment(e.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Materials */}
            <div className="admin-section">
              <h3>📄 Course Materials ({courseMaterials.length})</h3>
              {courseMaterials.length === 0 ? (
                <p>No materials uploaded</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Chunks</th>
                      <th>Uploaded</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseMaterials.map(m => (
                      <tr key={m.id}>
                        <td>{m.title}</td>
                        <td><span className="admin-type-badge">{m.type}</span></td>
                        <td>{m.chunkCount}</td>
                        <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn-small admin-btn-danger"
                            onClick={() => deleteMaterial(m.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="admin-tab-content">
            <h2>Upload Materials</h2>
            <div className="admin-upload-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Select Course</label>
                <select
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="admin-form-select"
                >
                  <option value="">Choose a course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Upload File (PDF, TXT, DOCX, etc.)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0])}
                  className="admin-form-input"
                />
              </div>

              <button
                onClick={handleUploadMaterial}
                disabled={loading}
                className="admin-btn admin-btn-upload"
              >
                {loading ? 'Uploading...' : 'Upload Material'}
              </button>

              <p className="admin-form-hint">
                💡 Upload any course material (PDF, Word, PowerPoint, Text files, etc.) to add to a course.
              </p>
            </div>
          </div>
        )}

        {/* ENROLLMENTS TAB */}
        {activeTab === 'enrollments' && (
          <div className="admin-tab-content">
            <h2>Student Enrollments</h2>
            {enrollments.length === 0 ? (
              <p>No enrollments found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Enrolled Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e.id}>
                      <td>{e.user.name}</td>
                      <td>{e.user.email}</td>
                      <td>{e.course.name}</td>
                      <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-small admin-btn-danger"
                          onClick={() => deleteEnrollment(e.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* EDIT COURSE MODAL */}
        {editingCourse && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <h3>Edit Course</h3>
              <input
                type="text"
                placeholder="Course Name"
                defaultValue={editingCourse.name}
                id="editName"
                className="admin-form-input"
              />
              <input
                type="text"
                placeholder="Subject"
                defaultValue={editingCourse.subject}
                id="editSubject"
                className="admin-form-input"
              />
              <textarea
                placeholder="Description"
                defaultValue={editingCourse.description}
                id="editDesc"
                className="admin-form-input"
              ></textarea>
              <div className="admin-modal-actions">
                <button
                  onClick={() => {
                    updateCourse(editingCourse.id, {
                      name: document.getElementById('editName').value,
                      subject: document.getElementById('editSubject').value,
                      description: document.getElementById('editDesc').value
                    });
                  }}
                  className="admin-btn admin-btn-primary"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingCourse(null)}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}