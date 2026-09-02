import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCourseId, setUploadCourseId] = useState('');

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      setMessage(`❌ Error loading stats: ${err.message}`);
    }
  };

  // Fetch all courses
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

  // Fetch course details
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

  // Fetch enrollments
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

  // Delete course
  const deleteCourse = async (courseId) => {
    if (!window.confirm('⚠️ Delete entire course? This cannot be undone.')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/course/${courseId}`);
      setMessage('✅ Course deleted');
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Update course
  const updateCourse = async (courseId, courseData) => {
    setLoading(true);
    try {
      await api.put(`/admin/course/${courseId}`, courseData);
      setMessage('✅ Course updated');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Delete material
  const deleteMaterial = async (materialId) => {
    if (!window.confirm('⚠️ Delete this material?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/material/${materialId}`);
      setMessage('✅ Material deleted');
      if (selectedCourse) fetchCourseDetails(selectedCourse.id);
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Delete enrollment
  const deleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('⚠️ Remove this student?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/enrollment/${enrollmentId}`);
      setMessage('✅ Student removed');
      fetchEnrollments();
      if (selectedCourse) fetchCourseDetails(selectedCourse.id);
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'courses') fetchCourses();
    if (activeTab === 'enrollments') fetchEnrollments();
  }, [activeTab]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'system-ui,sans-serif', color: 'var(--text)' }}>

      {/* Navbar */}
      <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-h)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>
              ← Home
            </button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-h)' }}>🛠️ Admin Dashboard</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => navigate('/analytics')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>
              📊 Analytics
            </button>
            <button onClick={logout} style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: `1px solid var(--accent-border)`, padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem' }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Message */}
      {message && (
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-h)', fontSize: '0.875rem' }}>{message}</span>
            <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'courses', label: '📚 Courses' },
            { id: 'materials', label: '📄 Materials' },
            { id: 'enrollments', label: '👥 Enrollments' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '0.95rem',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-h)' }}>⏳ Loading...</div>}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div>
            <h2 style={{ color: 'var(--text-h)', marginBottom: '1.5rem' }}>Dashboard Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
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
                <div key={i} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.5rem' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && !selectedCourse && (
          <div>
            <h2 style={{ color: 'var(--text-h)', marginBottom: '1.5rem' }}>Manage Courses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {courses.map(course => (
                <div key={course.id} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{ color: 'var(--text-h)', margin: '0 0 0.5rem' }}>{course.name}</h3>
                    <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{course.subject}</p>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-h)', display: 'flex', gap: '1rem' }}>
                      <span>👥 {course.studentCount} students</span>
                      <span>📄 {course.materialCount} materials</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => fetchCourseDetails(course.id)} style={{
                      background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem'
                    }}>
                      View Details
                    </button>
                    <button onClick={() => setEditingCourse(course)} style={{
                      background: 'var(--accent-bg)', color: 'var(--accent)', border: `1px solid var(--accent-border)`, padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem'
                    }}>
                      Edit
                    </button>
                    <button onClick={() => deleteCourse(course.id)} style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem'
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COURSE DETAILS */}
        {activeTab === 'courses' && selectedCourse && (
          <div>
            <button onClick={() => { setSelectedCourse(null); setCourseMaterials([]); }} style={{
              background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem'
            }}>
              ← Back to Courses
            </button>
            <h2 style={{ color: 'var(--text-h)', marginBottom: '1.5rem' }}>{selectedCourse.name}</h2>

            {/* Enrolled Students */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--text-h)', marginBottom: '1rem' }}>Enrolled Students ({selectedCourse.enrollments.length})</h3>
              {selectedCourse.enrollments.length === 0 ? (
                <p style={{ color: 'var(--text-h)' }}>No students enrolled</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-h)', fontWeight: '600' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-h)', fontWeight: '600' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-h)', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourse.enrollments.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text)' }}>{e.user.name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text)' }}>{e.user.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button onClick={() => deleteEnrollment(e.id)} style={{
                            background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem'
                          }}>
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
            <div>
              <h3 style={{ color: 'var(--text-h)', marginBottom: '1rem' }}>Course Materials ({courseMaterials.length})</h3>
              {courseMaterials.length === 0 ? (
                <p style={{ color: 'var(--text-h)' }}>No materials uploaded</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-h)', fontWeight: '600' }}>Title</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-h)', fontWeight: '600' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-h)', fontWeight: '600' }}>Chunks</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-h)', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseMaterials.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text)' }}>{m.title}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text)' }}>{m.type}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text)' }}>{m.chunkCount}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button onClick={() => deleteMaterial(m.id)} style={{
                            background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem'
                          }}>
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
          <div>
            <h2 style={{ color: 'var(--text-h)', marginBottom: '1.5rem' }}>Upload Materials</h2>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '2rem',
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--text-h)', fontWeight: '500', marginBottom: '0.5rem' }}>Select Course</label>
                <select value={uploadCourseId} onChange={(e) => setUploadCourseId(e.target.value)} style={{
                  width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem'
                }}>
                  <option value="">Choose a course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--text-h)', fontWeight: '500', marginBottom: '0.5rem' }}>Upload File (PDF, TXT, etc.)</label>
                <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0])} style={{
                  width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)'
                }} />
              </div>
              <button style={{
                width: '100%', padding: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem'
              }}>
                Upload Material
              </button>
              <p style={{ color: 'var(--text-h)', fontSize: '0.8rem', marginTop: '1rem' }}>💡 Upload any course material (PDF, Word, PowerPoint, etc.) to add to a course.</p>
            </div>
          </div>
        )}

        {/* ENROLLMENTS TAB */}
        {activeTab === 'enrollments' && (
          <div>
            <h2 style={{ color: 'var(--text-h)', marginBottom: '1.5rem' }}>Student Enrollments</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-h)', fontWeight: '600' }}>Student</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-h)', fontWeight: '600' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-h)', fontWeight: '600' }}>Course</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-h)', fontWeight: '600' }}>Enrolled Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-h)', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text)' }}>{e.user.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text)' }}>{e.user.email}</td>
                    <td style={{ padding: '1rem', color: 'var(--text)' }}>{e.course.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text)' }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => deleteEnrollment(e.id)} style={{
                        background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600'
                      }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EDIT COURSE MODAL */}
        {editingCourse && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%'
            }}>
              <h3 style={{ color: 'var(--text-h)', marginBottom: '1.5rem' }}>Edit Course</h3>
              <input type="text" placeholder="Course Name" defaultValue={editingCourse.name} id="editName" style={{
                width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box'
              }} />
              <input type="text" placeholder="Subject" defaultValue={editingCourse.subject} id="editSubject" style={{
                width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box'
              }} />
              <textarea placeholder="Description" defaultValue={editingCourse.description} id="editDesc" style={{
                width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box', minHeight: '100px'
              }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => {
                  updateCourse(editingCourse.id, {
                    name: document.getElementById('editName').value,
                    subject: document.getElementById('editSubject').value,
                    description: document.getElementById('editDesc').value
                  });
                }} style={{
                  flex: 1, padding: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                }}>
                  Save
                </button>
                <button onClick={() => setEditingCourse(null)} style={{
                  flex: 1, padding: '0.75rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                }}>
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