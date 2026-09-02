import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [newCourse, setNewCourse] = useState({ name: '', subject: '' });
  const [enrollForm, setEnrollForm] = useState({ userId: '', courseId: '' });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  // ── Fetch stats ────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  // ── Fetch all courses ──────────────────────────────────────
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data);
      setMessage('✅ Courses loaded');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Fetch all materials ──────────────────────────────────────
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
      setMessage('✅ Materials loaded');
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
      setEnrollments(response.data);
      setMessage('✅ Enrollments loaded');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Fetch users ──────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Users error:', err);
    }
  };

  // ── Create course ──────────────────────────────────────
  const createCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.name) return;
    setLoading(true);
    try {
      await api.post('/admin/courses', newCourse);
      setMessage('✅ Course created successfully');
      setNewCourse({ name: '', subject: '' });
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Enroll student ──────────────────────────────────────
  const enrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollForm.userId || !enrollForm.courseId) return;
    setLoading(true);
    try {
      await api.post('/admin/enroll', enrollForm);
      setMessage('✅ Student enrolled successfully');
      setEnrollForm({ userId: '', courseId: '' });
      fetchEnrollments();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Delete course ──────────────────────────────────────
  const deleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course and all its data?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/courses/${courseId}`);
      setMessage('✅ Course deleted');
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Update course ──────────────────────────────────────
  const updateCourse = async (courseId, data) => {
    setLoading(true);
    try {
      await api.put(`/admin/courses/${courseId}`, data);
      setMessage('✅ Course updated');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Delete material ──────────────────────────────────────
  const deleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    setLoading(true);
    try {
      await api.delete(`/materials/${materialId}`);
      setMessage('✅ Material deleted');
      fetchMaterials();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Load data on tab change ────────────────────────────────
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
      fetchCourses();
      fetchUsers();
    } else if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'materials') {
      fetchMaterials();
    } else if (activeTab === 'enrollments') {
      fetchEnrollments();
    }
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
            <button onClick={() => navigate('/admin/upload')} className="admin-nav-btn admin-nav-accent">
              📤 Upload Materials
            </button>
            <button onClick={() => navigate('/admin/analytics')} className="admin-nav-btn admin-nav-accent">
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
                { label: 'Total Users', value: stats.users || users.length, icon: '👥' },
                { label: 'Courses', value: stats.courses || courses.length, icon: '📚' },
                { label: 'Enrollments', value: stats.enrollments || enrollments.length, icon: '📝' },
                { label: 'Materials', value: stats.materials || materials.length, icon: '📄' },
                { label: 'Document Chunks', value: stats.chunks || 0, icon: '🔍' },
                { label: 'Chat Sessions', value: stats.chatSessions || 0, icon: '💬' },
                { label: 'Messages', value: stats.messages || 0, icon: '💭' },
                { label: 'Bookmarks', value: stats.bookmarks || 0, icon: '🔖' },
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
        {activeTab === 'courses' && (
          <div className="admin-tab-content">
            <h2>Manage Courses</h2>

            {/* Create Course Form */}
            <div className="admin-form-section">
              <h3>Create New Course</h3>
              <form onSubmit={createCourse} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Course name"
                  className="admin-form-input"
                  required
                  style={{ flex: 1, minWidth: '200px' }}
                />
                <input
                  value={newCourse.subject}
                  onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
                  placeholder="Subject"
                  className="admin-form-input"
                  style={{ flex: 1, minWidth: '150px' }}
                />
                <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
                  {loading ? 'Creating...' : '+ Create'}
                </button>
              </form>
            </div>

            {/* Courses List */}
            {courses.length === 0 ? (
              <p>No courses found</p>
            ) : (
              <div className="admin-courses-list">
                {courses.map((course) => (
                  <div key={course.id} className="admin-course-card">
                    <div className="admin-course-info">
                      <h3>{course.name}</h3>
                      <p className="admin-subject">{course.subject}</p>
                      <div className="admin-course-stats">
                        <span>👥 {course._count?.enrollments || 0} students</span>
                        <span>📄 {course._count?.materials || 0} materials</span>
                      </div>
                    </div>
                    <div className="admin-course-actions">
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

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="admin-tab-content">
            <div className="admin-materials-header">
              <h2>All Course Materials</h2>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => navigate('/admin/upload')}
              >
                📤 Upload New Material
              </button>
            </div>

            {materials.length === 0 ? (
              <p>No materials found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Uploaded Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id}>
                      <td>{m.title}</td>
                      <td>{m.course?.name || 'Unknown'}</td>
                      <td><span className="admin-type-badge">{m.type || 'PDF'}</span></td>
                      <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}</td>
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
        )}

        {/* ENROLLMENTS TAB */}
        {activeTab === 'enrollments' && (
          <div className="admin-tab-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Enroll Form */}
              <div className="admin-form-section">
                <h3>Enroll Student</h3>
                <form onSubmit={enrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label>Student</label>
                    <select
                      value={enrollForm.userId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                      className="admin-form-input"
                      required
                    >
                      <option value="">Select student...</option>
                      {users.filter(u => u.role !== 'ADMIN').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Course</label>
                    <select
                      value={enrollForm.courseId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                      className="admin-form-input"
                      required
                    >
                      <option value="">Select course...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
                    {loading ? 'Enrolling...' : 'Enroll Student'}
                  </button>
                </form>
              </div>

              {/* Enrollments List */}
              <div>
                <h3>All Enrollments ({enrollments.length})</h3>
                {enrollments.length === 0 ? (
                  <p>No enrollments found</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((e) => (
                        <tr key={e.id}>
                          <td>{e.user?.name || 'Unknown'}</td>
                          <td>{e.course?.name || 'Unknown'}</td>
                          <td>{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
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
              <div className="admin-modal-actions">
                <button
                  onClick={() => {
                    updateCourse(editingCourse.id, {
                      name: document.getElementById('editName').value,
                      subject: document.getElementById('editSubject').value,
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
