import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie,
  Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function Analytics() {
  const [stats, setStats]         = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/analytics'),
        ]);
        setStats(s.data);
        setAnalytics(a.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteMaterial = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/materials/${id}`);
      showToast('Material deleted successfully');
    } catch {
      showToast('Failed to delete material', 'error');
    }
  };

  const statCards = stats ? [
    { label: 'Total Students',    value: stats.students,      icon: '👥', color: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
    { label: 'Total Courses',     value: stats.courses,       icon: '📚', color: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
    { label: 'Total Questions',   value: stats.totalMessages, icon: '💬', color: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
    { label: 'AI Responses',      value: stats.aiMessages,    icon: '🤖', color: '#fff7ed', border: '#fed7aa', text: '#92400e' },
    { label: 'Study Sessions',    value: stats.sessions,      icon: '🗂️', color: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    { label: 'Satisfaction Rate', value: `${stats.satisfactionRate}%`, icon: '⭐', color: '#fefce8', border: '#fde68a', text: '#92400e' },
  ] : [];

  const tabs = [
    { id: 'overview',   label: '📊 Overview'   },
    { id: 'activity',   label: '📈 Daily Activity' },
    { id: 'courses',    label: '📚 Courses'    },
    { id: 'questions',  label: '💬 Questions'  },
  ];

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📊</div>
          <p style={{ color:'#64748b', fontWeight:'500' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:999, background: toast.type==='error' ? '#fef2f2' : '#f0fdf4', border:`1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`, color: toast.type==='error' ? '#dc2626' : '#16a34a', padding:'0.75rem 1.25rem', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'500', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate('/admin')} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer' }}>← Admin</button>
            <span style={{ color:'#d1d5db' }}>|</span>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>📊 Analytics Dashboard</span>
          </div>
          <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'500' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth:'1200px', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Stats Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'1.5rem' }}>{card.icon}</span>
                <span style={{ background:card.color, border:`1px solid ${card.border}`, color:card.text, fontSize:'0.7rem', fontWeight:'600', padding:'0.15rem 0.5rem', borderRadius:'20px' }}>LIVE</span>
              </div>
              <p style={{ fontSize:'1.75rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.25rem' }}>{card.value}</p>
              <p style={{ fontSize:'0.8rem', color:'#64748b', margin:0 }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.375rem', background:'#f1f5f9', padding:'0.375rem', borderRadius:'12px', width:'fit-content', marginBottom:'1.5rem' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding:'0.5rem 1.25rem', borderRadius:'9px', border:'none', fontSize:'0.875rem', fontWeight:'500', cursor:'pointer', background: activeTab===tab.id ? '#fff' : 'none', color: activeTab===tab.id ? '#0f172a' : '#64748b', boxShadow: activeTab===tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition:'all 0.15s' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>

            {/* Materials per course */}
            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem' }}>
              <h3 style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 1.25rem', fontSize:'0.95rem' }}>Materials per Course</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.materialsPerCourse} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#64748b' }} />
                  <YAxis tick={{ fontSize:11, fill:'#64748b' }} />
                  <Tooltip contentStyle={{ fontSize:'12px', borderRadius:'8px', border:'1px solid #e2e8f0' }} />
                  <Bar dataKey="materials" fill="#6366f1" radius={[4,4,0,0]} name="Materials" />
                  <Bar dataKey="enrollments" fill="#10b981" radius={[4,4,0,0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Satisfaction */}
            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem' }}>
              <h3 style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 1.25rem', fontSize:'0.95rem' }}>Feedback Summary</h3>
              {stats && (
                <div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[
                        { name: `👍 Helpful (${stats.thumbsUp})`,     value: stats.thumbsUp     || 1 },
                        { name: `👎 Not helpful (${stats.thumbsDown})`, value: stats.thumbsDown || 0 },
                      ]} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ fontSize:'12px', borderRadius:'8px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize:'12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ textAlign:'center', marginTop:'0.5rem' }}>
                    <span style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0f172a' }}>{stats.satisfactionRate}%</span>
                    <p style={{ color:'#64748b', fontSize:'0.8rem', margin:'0.25rem 0 0' }}>Satisfaction rate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily Activity Tab */}
        {activeTab === 'activity' && analytics && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem' }}>
            <h3 style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 1.25rem', fontSize:'0.95rem' }}>Daily Activity — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyActivity} margin={{ top:5, right:20, left:-10, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize:11, fill:'#64748b' }}
                  tickFormatter={d => new Date(d).toLocaleDateString('en-NZ', { weekday:'short', month:'short', day:'numeric' })} />
                <YAxis tick={{ fontSize:11, fill:'#64748b' }} />
                <Tooltip
                  contentStyle={{ fontSize:'12px', borderRadius:'8px', border:'1px solid #e2e8f0' }}
                  labelFormatter={d => new Date(d).toLocaleDateString('en-NZ', { weekday:'long', month:'long', day:'numeric' })}
                />
                <Legend wrapperStyle={{ fontSize:'12px' }} />
                <Line type="monotone" dataKey="questions" stroke="#6366f1" strokeWidth={2} dot={{ r:4 }} name="Questions" />
                <Line type="monotone" dataKey="answers"   stroke="#10b981" strokeWidth={2} dot={{ r:4 }} name="AI Answers" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && analytics && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem' }}>
              <h3 style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 1.25rem', fontSize:'0.95rem' }}>Course Activity (Questions Asked)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.courseStats} layout="vertical" margin={{ top:5, right:20, left:60, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize:11, fill:'#64748b' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#64748b' }} width={100} />
                  <Tooltip contentStyle={{ fontSize:'12px', borderRadius:'8px', border:'1px solid #e2e8f0' }} />
                  <Bar dataKey="questions" fill="#6366f1" radius={[0,4,4,0]} name="Questions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Course breakdown table */}
            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
              <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
                <h3 style={{ fontWeight:'600', color:'#0f172a', margin:0, fontSize:'0.95rem' }}>Course Breakdown</h3>
              </div>
              {analytics.courseStats.map((c, i) => (
                <div key={i} style={{ padding:'0.875rem 1.5rem', borderBottom: i < analytics.courseStats.length-1 ? '1px solid #f8fafc' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:'600', color:'#0f172a', fontSize:'0.875rem' }}>{c.name}</span>
                  <div style={{ display:'flex', gap:'1rem' }}>
                    <span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:'0.75rem', fontWeight:'600', padding:'0.2rem 0.6rem', borderRadius:'20px' }}>{c.questions} questions</span>
                    <span style={{ background:'#ecfdf5', color:'#065f46', fontSize:'0.75rem', fontWeight:'600', padding:'0.2rem 0.6rem', borderRadius:'20px' }}>{c.answers} answers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && analytics && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontWeight:'600', color:'#0f172a', margin:0, fontSize:'0.95rem' }}>Recent Student Questions</h3>
              <span style={{ fontSize:'0.8rem', color:'#64748b' }}>Last 50 questions</span>
            </div>
            {analytics.recentQuestions.map((q, i) => (
              <div key={i} style={{ padding:'0.875rem 1.5rem', borderBottom: i < analytics.recentQuestions.length-1 ? '1px solid #f8fafc' : 'none', display:'flex', alignItems:'center', gap:'1rem' }}>
                <div style={{ width:'28px', height:'28px', background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#6366f1', flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:'0.875rem', color:'#0f172a' }}>{q.content}</p>
                </div>
                <span style={{ fontSize:'0.7rem', color:'#94a3b8', flexShrink:0 }}>
                  {new Date(q.createdAt).toLocaleDateString('en-NZ', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}