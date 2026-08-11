import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const COLORS = [
  { bg:'#eff6ff', border:'#bfdbfe', icon:'#3b82f6', text:'#1d4ed8' },
  { bg:'#f5f3ff', border:'#ddd6fe', icon:'#8b5cf6', text:'#6d28d9' },
  { bg:'#ecfdf5', border:'#a7f3d0', icon:'#10b981', text:'#065f46' },
  { bg:'#fff7ed', border:'#fed7aa', icon:'#f59e0b', text:'#92400e' },
];

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses/my-courses')
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📚</div>
            <span style={{ fontWeight:'700', fontSize:'1rem', color:'#0f172a' }}>AI Study Assistant</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            {user?.role === 'ADMIN' && (
              <button onClick={() => navigate('/admin')} style={{ background:'none', border:'none', color:'#6366f1', fontWeight:'600', fontSize:'0.875rem', cursor:'pointer' }}>
                Admin Panel
              </button>
            )}
            <div style={{ width:'32px', height:'32px', background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'13px', color:'#6366f1' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize:'0.875rem', color:'#64748b' }}>{user?.name}</span>
            <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.35rem 0.875rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'500' }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'2.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'1.75rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.35rem' }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'#64748b', margin:0, fontSize:'0.95rem' }}>
            {courses.length > 0
              ? `You are enrolled in ${courses.length} course${courses.length > 1 ? 's' : ''}. Start studying below.`
              : 'No courses enrolled yet. Contact your admin to get started.'}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.25rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem', height:'160px' }} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'4rem', textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📭</div>
            <h3 style={{ color:'#374151', fontWeight:'600', margin:'0 0 0.5rem' }}>No courses yet</h3>
            <p style={{ color:'#9ca3af', margin:0 }}>Ask your admin to enroll you in a course.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.25rem' }}>
            {courses.map((enrollment, index) => {
              const course = enrollment.course || enrollment;
              const color  = COLORS[index % COLORS.length];
              return (
                <button
                  key={course.id}
                  onClick={() => navigate(`/chat/${course.id}`)}
                  style={{
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    borderRadius:'16px', padding:'1.5rem',
                    textAlign:'left', cursor:'pointer',
                    transition:'all 0.2s', width:'100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
                >
                  <div style={{ width:'44px', height:'44px', background: color.icon, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', marginBottom:'1rem' }}>📖</div>
                  <h3 style={{ fontWeight:'700', color:'#0f172a', margin:'0 0 0.35rem', fontSize:'1rem' }}>{course.name}</h3>
                  <p style={{ color:'#64748b', margin:'0 0 1rem', fontSize:'0.85rem' }}>{course.subject || 'Start chatting with AI tutor'}</p>
                  <span style={{ color: color.text, fontSize:'0.8rem', fontWeight:'600' }}>Open chat →</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div style={{ marginTop:'2rem', background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:'40px', height:'40px', background:'#eff6ff', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>🛡️</div>
          <div>
            <p style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 0.15rem', fontSize:'0.9rem' }}>AI answers from your lecture notes only</p>
            <p style={{ color:'#64748b', margin:0, fontSize:'0.8rem' }}>The AI tutor is trained exclusively on your uploaded course materials — not the internet.</p>
          </div>
        </div>
      </main>
    </div>
  );
}