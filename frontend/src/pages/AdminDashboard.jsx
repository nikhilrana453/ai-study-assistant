import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const S = {
  page: { minHeight: '100vh', background: '#f5f6fa', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#f1f5f9' },
  nav: {
    background: '#ffffff',
    borderBottom: '1px solid rgba(99,115,145,0.12)',
    boxShadow: '0 1px 3px rgba(30,41,59,0.06)',
    padding: '1rem 1.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navInner: { maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '0.625rem' },
  navLogo: { width: '36px', height: '36px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  navTitle: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: '700', fontSize: '1.125rem', color: '#f1f5f9', letterSpacing: '-0.01em' },
  navBadge: { background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.20)', color: '#b45309', fontSize: '0.6875rem', fontWeight: '700', padding: '0.2rem 0.625rem', borderRadius: '20px', letterSpacing: '0.05em', textTransform: 'uppercase' },
  navRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  uploadBtn: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#ffffff', fontWeight: '700', fontSize: '0.875rem', padding: '0.5rem 1.125rem', borderRadius: '10px', cursor: 'pointer', letterSpacing: '0.01em' },
  logoutBtn: { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626', padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: '500' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  successBanner: { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', color: '#059669', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem' },
  card: { background: '#ffffff', border: '1px solid rgba(99,115,145,0.12)', boxShadow: '0 1px 4px rgba(30,41,59,0.05)', borderRadius: '16px', padding: '1.75rem' },
  cardTitle: { fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.25rem', letterSpacing: '-0.01em' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '0.6875rem 0.875rem', background: '#f8f9fc', border: '1px solid rgba(99,115,145,0.16)', borderRadius: '10px', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  select: { width: '100%', padding: '0.6875rem 0.875rem', background: '#f8f9fc', border: '1px solid rgba(99,115,145,0.16)', borderRadius: '10px', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box', appearance: 'none' },
  createBtn: { marginTop: '1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#ffffff', fontWeight: '700', fontSize: '0.9rem', padding: '0.625rem 1.5rem', borderRadius: '10px', cursor: 'pointer', letterSpacing: '0.01em' },
  enrollBtn: { marginTop: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669', fontWeight: '700', fontSize: '0.9rem', padding: '0.625rem 1.5rem', borderRadius: '10px', cursor: 'pointer', letterSpacing: '0.01em' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0 0.75rem 0.875rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid rgba(99,115,145,0.12)' },
  tr: { borderBottom: '1px solid rgba(99,115,145,0.08)' },
  td: { padding: '0.875rem 0.75rem', color: '#475569', verticalAlign: 'middle' },
  tdName: { padding: '0.875rem 0.75rem', color: '#1e293b', fontWeight: '600' },
  countBadge: { background: 'rgba(99,115,145,0.07)', border: '1px solid rgba(99,115,145,0.14)', color: '#64748b', fontSize: '0.75rem', padding: '0.2rem 0.625rem', borderRadius: '20px', display: 'inline-block' },
};

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
    setMessage('Course created successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const enrollStudent = async () => {
    if (!enrollForm.userId || !enrollForm.courseId) return;
    await api.post('/admin/enroll', enrollForm);
    setMessage('Student enrolled successfully!');
    setEnrollForm({ userId: '', courseId: '' });
    setTimeout(() => setMessage(''), 3000);
  };

  const inputFocusStyle = { borderColor: 'rgba(217,119,6,0.5)', boxShadow: '0 0 0 3px rgba(217,119,6,0.08)' };

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navBrand}>
            <div style={S.navLogo}>📚</div>
            <span style={S.navTitle}>Study Assistant</span>
            <span style={S.navBadge}>Admin</span>
          </div>
          <div style={S.navRight}>
            <button onClick={() => navigate('/admin/upload')} style={S.uploadBtn}>↑ Upload Materials</button>
            <button onClick={logout} style={S.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>

      <main style={S.main}>
        {message && <div style={S.successBanner}>✓ {message}</div>}

        {/* Create Course */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>Create Course</h2>
          <div style={S.formGrid}>
            {[
              { key: 'name', placeholder: 'Course name' },
              { key: 'subject', placeholder: 'Subject' },
              { key: 'description', placeholder: 'Description (optional)' },
            ].map(({ key, placeholder }) => (
              <div key={key}>
                <label style={S.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  placeholder={placeholder}
                  value={newCourse[key]}
                  onChange={(e) => setNewCourse({ ...newCourse, [key]: e.target.value })}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.15)'; e.target.style.boxShadow = 'none'; }}
                  style={S.input}
                />
              </div>
            ))}
          </div>
          <button onClick={createCourse} style={S.createBtn}>Create Course →</button>
        </div>

        {/* Enroll Student */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>Enroll Student in Course</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={S.label}>Student</label>
              <select
                value={enrollForm.userId}
                onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                style={S.select}
              >
                <option value="">Select student...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Course</label>
              <select
                value={enrollForm.courseId}
                onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                style={S.select}
              >
                <option value="">Select course...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={enrollStudent} style={S.enrollBtn}>Enroll Student →</button>
        </div>

        {/* Courses Table */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>All Courses</h2>
          <table style={S.table}>
            <thead>
              <tr>
                {['Course Name', 'Subject', 'Students', 'Materials'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} style={S.tr}>
                  <td style={S.tdName}>{c.name}</td>
                  <td style={S.td}>{c.subject}</td>
                  <td style={S.td}><span style={S.countBadge}>{c._count?.enrollments ?? 0}</span></td>
                  <td style={S.td}><span style={S.countBadge}>{c._count?.materials ?? 0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}