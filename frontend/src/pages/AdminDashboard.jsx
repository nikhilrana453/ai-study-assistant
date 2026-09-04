import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ─────── STATE ───────────
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // COURSES form state
  const [courseForm, setCourseForm] = useState({ name: '', subject: '', description: '' });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState({});

  // MATERIALS form state
  const [materialForm, setMaterialForm] = useState({ title: '', type: 'pdf', topic: '', week: '' });
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialCourseId, setMaterialCourseId] = useState(null);

  // STUDENTS form state
  const [studentForm, setStudentForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  // ENROLL form state
  const [enrollForm, setEnrollForm] = useState({ userId: '', courseId: '' });
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  // ─────── LOAD DATA ───────────
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [coursesRes, studentsRes, enrollRes, statsRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/users'),
        api.get('/admin/enrollments'),
        api.get('/admin/stats')
      ]);

      setCourses(coursesRes.data || []);
      setStudents(studentsRes.data || []);
      setEnrollments(enrollRes.data.enrollments || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      showToast('Error loading data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─────── TOAST ───────────
  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ═════════════════════════════════════════════════════════
  // COURSES CRUD
  // ═════════════════════════════════════════════════════════

  const handleSaveCourse = async () => {
    if (!courseForm.name.trim()) {
      showToast('Course name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingCourseId) {
        await api.put(`/admin/courses/${editingCourseId}`, courseForm);
        showToast('Course updated successfully');
      } else {
        await api.post('/admin/courses', courseForm);
        showToast('Course created successfully');
      }
      setCourseForm({ name: '', subject: '', description: '' });
      setEditingCourseId(null);
      setShowCourseForm(false);
      loadAllData();
    } catch (err) {
      showToast('Error saving course: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setCourseForm({ name: course.name, subject: course.subject, description: course.description });
    setEditingCourseId(course.id);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course? This will delete all materials and enrollments.')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/courses/${courseId}`);
      showToast('Course deleted successfully');
      loadAllData();
    } catch (err) {
      showToast('Error deleting course: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseMaterials = async (courseId) => {
    try {
      const res = await api.get(`/admin/courses/${courseId}/materials`);
      setCourseMaterials(prev => ({ ...prev, [courseId]: res.data.materials }));
    } catch (err) {
      showToast('Error loading materials: ' + err.message, 'error');
    }
  };

  // ═════════════════════════════════════════════════════════
  // MATERIALS CRUD
  // ═════════════════════════════════════════════════════════

  const handleSaveMaterial = async () => {
    if (!materialForm.title.trim() || !materialCourseId) {
      showToast('Material title and course are required', 'error');
      return;
    }

    setLoading(true);
    try {
      // Note: Full material upload would require file upload
      // This is a placeholder for basic metadata
      if (editingMaterialId) {
        // Update would go here
        showToast('Material update not yet implemented - requires file upload');
      } else {
        showToast('Material creation not yet implemented - requires file upload and backend processing');
      }
      setMaterialForm({ title: '', type: 'pdf', topic: '', week: '' });
      setEditingMaterialId(null);
      setShowMaterialForm(false);
      setMaterialCourseId(null);
    } catch (err) {
      showToast('Error saving material: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId, courseId) => {
    if (!confirm('Delete this material?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/materials/${materialId}`);
      showToast('Material deleted successfully');
      loadCourseMaterials(courseId);
    } catch (err) {
      showToast('Error deleting material: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════
  // STUDENTS CRUD
  // ═════════════════════════════════════════════════════════

  const handleSaveStudent = async () => {
    if (!studentForm.name.trim() || !studentForm.email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingStudentId) {
        // Update student (backend needs to support this)
        showToast('Student update not yet implemented in backend');
      } else {
        // Create student via registration endpoint or direct API
        await api.post('/auth/register', {
          name: studentForm.name,
          email: studentForm.email,
          password: studentForm.password || 'TempPassword123!',
          role: studentForm.role
        });
        showToast('Student created successfully');
      }
      setStudentForm({ name: '', email: '', password: '', role: 'STUDENT' });
      setEditingStudentId(null);
      setShowStudentForm(false);
      loadAllData();
    } catch (err) {
      showToast('Error saving student: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentEmail) => {
    if (!confirm(`Delete student ${studentEmail}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await api.delete(`/admin/users/${studentId}`);
      showToast('Student deleted successfully');
      loadAllData();
    } catch (err) {
      showToast('Error deleting student: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════
  // ENROLLMENTS CRUD
  // ═════════════════════════════════════════════════════════

  const handleEnrollStudent = async () => {
    if (!enrollForm.userId || !enrollForm.courseId) {
      showToast('Please select both student and course', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/enroll', {
        userId: enrollForm.userId,
        courseId: enrollForm.courseId
      });
      showToast('Student enrolled successfully');
      setEnrollForm({ userId: '', courseId: '' });
      setShowEnrollForm(false);
      loadAllData();
    } catch (err) {
      showToast('Error enrolling student: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId) => {
    if (!confirm('Remove this enrollment?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/enrollments/${enrollmentId}`);
      showToast('Enrollment removed successfully');
      loadAllData();
    } catch (err) {
      showToast('Error removing enrollment: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─────── STYLES ───────────
  const styles = {
    container: {
      padding: '1.5rem',
      background: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    },
    navbar: {
      background: '#fff',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      borderRadius: '12px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    statCard: {
      background: '#fff',
      padding: '1.25rem',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    statValue: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#6366f1',
      margin: '0.5rem 0 0',
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#64748b',
      fontWeight: '500',
    },
    tabs: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      borderBottom: '2px solid #e2e8f0',
    },
    tab: (active) => ({
      padding: '0.75rem 1.5rem',
      background: active ? '#6366f1' : 'transparent',
      color: active ? '#fff' : '#64748b',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '600',
      borderRadius: '8px 8px 0 0',
      transition: 'all 0.2s',
    }),
    card: {
      background: '#fff',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '1rem',
    },
    button: (variant = 'primary') => ({
      padding: '0.6rem 1.2rem',
      background: variant === 'primary' ? '#6366f1' : variant === 'danger' ? '#ef4444' : '#f1f5f9',
      color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#fff' : '#0f172a',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.2s',
    }),
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '0.9rem',
      marginBottom: '0.75rem',
      fontFamily: 'system-ui, sans-serif',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    toast: (type) => ({
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      background: type === 'error' ? '#ef4444' : '#10b981',
      color: '#fff',
      borderRadius: '8px',
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    }),
  };

  return (
    <div style={styles.container}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Admin Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin/upload')}
            style={styles.button('primary')}
          >
            📤 Upload Materials
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            style={styles.button('primary')}
          >
            📊 Analytics
          </button>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {user?.name}
          </span>
          <button
            onClick={logout}
            style={styles.button()}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* STATS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Courses</div>
          <div style={styles.statValue}>{stats.courses || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Students</div>
          <div style={styles.statValue}>{stats.users || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Enrollments</div>
          <div style={styles.statValue}>{stats.enrollments || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Materials</div>
          <div style={styles.statValue}>{stats.materials || 0}</div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={styles.toast(toast.includes('Error') ? 'error' : 'success')}>
          {toast}
        </div>
      )}

      {/* TABS */}
      <div style={styles.tabs}>
        {['courses', 'materials', 'students', 'enrollments'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={styles.tab(activeTab === tab)}
          >
            {tab === 'courses' && '📚 Courses'}
            {tab === 'materials' && '📄 Materials'}
            {tab === 'students' && '👥 Students'}
            {tab === 'enrollments' && '📋 Enrollments'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* COURSES TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'courses' && (
        <div>
          <button
            onClick={() => {
              setShowCourseForm(!showCourseForm);
              setCourseForm({ name: '', subject: '', description: '' });
              setEditingCourseId(null);
            }}
            style={styles.button('primary')}
          >
            {showCourseForm ? '✕ Cancel' : '➕ Add Course'}
          </button>

          {showCourseForm && (
            <div style={{ ...styles.card, background: '#f8fafc', marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>
                {editingCourseId ? 'Edit Course' : 'Create New Course'}
              </h3>
              <div style={styles.formGrid}>
                <input
                  type="text"
                  placeholder="Course Name"
                  value={courseForm.name}
                  onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={courseForm.subject}
                  onChange={e => setCourseForm({ ...courseForm, subject: e.target.value })}
                  style={styles.input}
                />
              </div>
              <textarea
                placeholder="Description"
                value={courseForm.description}
                onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleSaveCourse}
                  disabled={loading}
                  style={styles.button('primary')}
                >
                  {loading ? '⏳ Saving...' : '💾 Save'}
                </button>
                <button
                  onClick={() => {
                    setShowCourseForm(false);
                    setEditingCourseId(null);
                  }}
                  style={styles.button()}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            {courses.map(course => (
              <div key={course.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>{course.name}</h3>
                    <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                      📚 {course._count?.materials || 0} materials · 👥 {course._count?.enrollments || 0} students
                    </p>
                    {course.description && (
                      <p style={{ margin: '0.5rem 0 0', color: '#475569', fontSize: '0.85rem' }}>
                        {course.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setExpandedCourseId(expandedCourseId === course.id ? null : course.id);
                        if (expandedCourseId !== course.id) {
                          loadCourseMaterials(course.id);
                        }
                      }}
                      style={styles.button()}
                    >
                      {expandedCourseId === course.id ? '▼' : '▶'} View
                    </button>
                    <button
                      onClick={() => handleEditCourse(course)}
                      style={styles.button()}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      style={styles.button('danger')}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {expandedCourseId === course.id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginTop: 0, color: '#475569' }}>Materials in this course:</h4>
                    {courseMaterials[course.id]?.length === 0 ? (
                      <p style={{ color: '#94a3b8' }}>No materials uploaded yet</p>
                    ) : (
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                        {courseMaterials[course.id]?.map(material => (
                          <li key={material.id} style={{ color: '#475569', marginBottom: '0.25rem' }}>
                            <strong>{material.title}</strong> ({material.chunkCount} chunks)
                            <button
                              onClick={() => handleDeleteMaterial(material.id, course.id)}
                              style={{
                                marginLeft: '0.5rem',
                                padding: '0.2rem 0.5rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                              }}
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MATERIALS TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'materials' && (
        <div>
          <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ffc107' }}>
            <strong>📌 Note:</strong> Material upload requires the Upload Materials page. Use the "Upload Materials" button in the navbar to upload files for courses.
          </div>
          <button
            onClick={() => navigate('/admin/upload')}
            style={styles.button('primary')}
          >
            📤 Go to Upload Materials
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* STUDENTS TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <div>
          <button
            onClick={() => {
              setShowStudentForm(!showStudentForm);
              setStudentForm({ name: '', email: '', password: '', role: 'STUDENT' });
              setEditingStudentId(null);
            }}
            style={styles.button('primary')}
          >
            {showStudentForm ? '✕ Cancel' : '➕ Add Student'}
          </button>

          {showStudentForm && (
            <div style={{ ...styles.card, background: '#f8fafc', marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Add New Student</h3>
              <div style={styles.formGrid}>
                <input
                  type="text"
                  placeholder="Student Name"
                  value={studentForm.name}
                  onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={studentForm.email}
                  onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="password"
                  placeholder="Temporary Password"
                  value={studentForm.password}
                  onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleSaveStudent}
                  disabled={loading}
                  style={styles.button('primary')}
                >
                  {loading ? '⏳ Creating...' : '✅ Create Student'}
                </button>
                <button
                  onClick={() => setShowStudentForm(false)}
                  style={styles.button()}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Email</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Role</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', color: '#0f172a' }}>{student.name}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>{student.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        background: student.role === 'ADMIN' ? '#ede9fe' : '#dbeafe',
                        color: student.role === 'ADMIN' ? '#7c3aed' : '#0369a1',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {student.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.email)}
                        style={styles.button('danger')}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ENROLLMENTS TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'enrollments' && (
        <div>
          <button
            onClick={() => {
              setShowEnrollForm(!showEnrollForm);
              setEnrollForm({ userId: '', courseId: '' });
            }}
            style={styles.button('primary')}
          >
            {showEnrollForm ? '✕ Cancel' : '➕ Enroll Student'}
          </button>

          {showEnrollForm && (
            <div style={{ ...styles.card, background: '#f8fafc', marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Enroll Student in Course</h3>
              <div style={styles.formGrid}>
                <select
                  value={enrollForm.userId}
                  onChange={e => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
                <select
                  value={enrollForm.courseId}
                  onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleEnrollStudent}
                  disabled={loading}
                  style={styles.button('primary')}
                >
                  {loading ? '⏳ Enrolling...' : '✅ Enroll'}
                </button>
                <button
                  onClick={() => setShowEnrollForm(false)}
                  style={styles.button()}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Student</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Course</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Enrolled Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(enrollment => (
                  <tr key={enrollment.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ color: '#0f172a', fontWeight: '500' }}>{enrollment.user?.name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{enrollment.user?.email}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#0f172a' }}>{enrollment.course?.name}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleRemoveEnrollment(enrollment.id)}
                        style={styles.button('danger')}
                      >
                        ❌ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}