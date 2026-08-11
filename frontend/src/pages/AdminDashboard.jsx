import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function AdminDashboard() {
  const [courses, setCourses]       = useState([]);
  const [users, setUsers]           = useState([]);
  const [newCourse, setNewCourse]   = useState({ name:'', subject:'' });
  const [enrollForm, setEnrollForm] = useState({ userId:'', courseId:'' });
  const [activeTab, setActiveTab]   = useState('courses');
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/courses').then(r => setCourses(r.data)).catch(console.error);
    api.get('/admin/users').then(r => setUsers(r.data)).catch(console.error);
  }, []);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/courses', newCourse);
      setCourses(prev => [...prev, res.data]);
      setNewCourse({ name:'', subject:'' });
      showToast('Course created successfully');
    } catch { showToast('Failed to create course', 'error'); }
    finally { setLoading(false); }
  };

  const enrollStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/enroll', enrollForm);
      setEnrollForm({ userId:'', courseId:'' });
      showToast('Student enrolled successfully');
      api.get('/admin/courses').then(r => setCourses(r.data));
    } catch { showToast('Failed to enroll student', 'error'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id:'courses',  label:'Courses',  count: courses.length },
    { id:'students', label:'Students', count: users.length },
    { id:'enroll',   label:'Enroll',   count: null },
  ];

  const inputStyle = { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', color:'#0f172a', background:'#fff' };
  const selectStyle = { ...inputStyle, background:'#fff' };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:999, background: toast.type==='error' ? '#fef2f2' : '#f0fdf4', border:`1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`, color: toast.type==='error' ? '#dc2626' : '#16a34a', padding:'0.75rem 1.25rem', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'500', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast.type==='error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📚</div>
            <span style={{ fontWeight:'700', fontSize:'1rem', color:'#0f172a' }}>Admin Panel</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate('/admin/upload')} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', padding:'0.45rem 1rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'600' }}>
              ↑ Upload Materials
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'1px solid #e2e8f0', color:'#64748b', padding:'0.45rem 1rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>
              Dashboard
            </button>
            <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.45rem 0.9rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'500' }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Total Courses',     value: courses.length, icon:'📚', color:'#eff6ff' },
            { label:'Total Students',    value: users.length,   icon:'👥', color:'#f5f3ff' },
            { label:'Total Enrollments', value: courses.reduce((a,c) => a+(c._count?.enrollments||0), 0), icon:'✅', color:'#ecfdf5' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.25rem 1.5rem' }}>
              <p style={{ color:'#64748b', fontSize:'0.8rem', margin:'0 0 0.5rem' }}>{s.label}</p>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <span style={{ fontSize:'1.75rem' }}>{s.icon}</span>
                <span style={{ fontSize:'1.75rem', fontWeight:'700', color:'#0f172a' }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.375rem', background:'#f1f5f9', padding:'0.375rem', borderRadius:'12px', width:'fit-content', marginBottom:'1.5rem' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding:'0.5rem 1.25rem', borderRadius:'9px', border:'none', fontSize:'0.875rem', fontWeight:'500', cursor:'pointer', background: activeTab===tab.id ? '#fff' : 'none', color: activeTab===tab.id ? '#0f172a' : '#64748b', boxShadow: activeTab===tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition:'all 0.15s', display:'flex', alignItems:'center', gap:'0.5rem' }}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{ background: activeTab===tab.id ? '#eff6ff' : '#e2e8f0', color: activeTab===tab.id ? '#6366f1' : '#64748b', fontSize:'0.75rem', padding:'0.1rem 0.5rem', borderRadius:'20px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Courses Tab */}
        {activeTab==='courses' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem' }}>
              <h3 style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 1rem', fontSize:'0.95rem' }}>Create new course</h3>
              <form onSubmit={createCourse} style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                <input value={newCourse.name} onChange={e => setNewCourse({...newCourse,name:e.target.value})} placeholder="Course name (e.g. Studio 5)" required style={{ ...inputStyle, flex:1, minWidth:'200px' }} />
                <input value={newCourse.subject} onChange={e => setNewCourse({...newCourse,subject:e.target.value})} placeholder="Subject" style={{ ...inputStyle, flex:1, minWidth:'150px' }} />
                <button type="submit" disabled={loading} style={{ padding:'0.65rem 1.25rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {loading ? 'Creating...' : '+ Create Course'}
                </button>
              </form>
            </div>

            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
              <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontWeight:'600', color:'#0f172a', margin:0, fontSize:'0.95rem' }}>All Courses</h3>
                <span style={{ fontSize:'0.8rem', color:'#64748b' }}>{courses.length} total</span>
              </div>
              {courses.length === 0 ? (
                <p style={{ textAlign:'center', color:'#9ca3af', padding:'2rem', margin:0 }}>No courses yet. Create one above.</p>
              ) : courses.map((course,i) => (
                <div key={course.id} style={{ padding:'1rem 1.5rem', borderBottom: i < courses.length-1 ? '1px solid #f8fafc' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 0.2rem', fontSize:'0.9rem' }}>{course.name}</p>
                    <p style={{ color:'#9ca3af', margin:0, fontSize:'0.75rem', fontFamily:'monospace' }}>{course.id}</p>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <span style={{ background:'#eff6ff', color:'#6366f1', fontSize:'0.75rem', fontWeight:'600', padding:'0.25rem 0.75rem', borderRadius:'20px' }}>{course._count?.enrollments||0} students</span>
                    <span style={{ background:'#f1f5f9', color:'#64748b', fontSize:'0.75rem', fontWeight:'600', padding:'0.25rem 0.75rem', borderRadius:'20px' }}>{course._count?.materials||0} materials</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab==='students' && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight:'600', color:'#0f172a', margin:0, fontSize:'0.95rem' }}>All Students</h3>
            </div>
            {users.map((u,i) => (
              <div key={u.id} style={{ padding:'1rem 1.5rem', borderBottom: i < users.length-1 ? '1px solid #f8fafc' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:'36px', height:'36px', background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'13px', color:'#6366f1' }}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 0.1rem', fontSize:'0.875rem' }}>{u.name}</p>
                    <p style={{ color:'#9ca3af', margin:0, fontSize:'0.75rem' }}>{u.email}</p>
                  </div>
                </div>
                <span style={{ background: u.role==='ADMIN' ? '#f5f3ff' : '#f1f5f9', color: u.role==='ADMIN' ? '#7c3aed' : '#64748b', fontSize:'0.75rem', fontWeight:'600', padding:'0.25rem 0.75rem', borderRadius:'20px' }}>
                  {u.role==='ADMIN' ? 'Admin' : 'Student'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Enroll Tab */}
        {activeTab==='enroll' && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem', maxWidth:'480px' }}>
            <h3 style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 0.35rem', fontSize:'0.95rem' }}>Enroll a student</h3>
            <p style={{ color:'#64748b', margin:'0 0 1.25rem', fontSize:'0.85rem' }}>Assign a student to a course so they can access the AI tutor.</p>
            <form onSubmit={enrollStudent} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Student</label>
                <select value={enrollForm.userId} onChange={e => setEnrollForm({...enrollForm,userId:e.target.value})} required style={selectStyle}>
                  <option value="">Select student...</option>
                  {users.filter(u => u.role!=='ADMIN').map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Course</label>
                <select value={enrollForm.courseId} onChange={e => setEnrollForm({...enrollForm,courseId:e.target.value})} required style={selectStyle}>
                  <option value="">Select course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} style={{ padding:'0.75rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer' }}>
                {loading ? 'Enrolling...' : 'Enroll Student →'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}