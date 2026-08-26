import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const [profile, setProfile]     = useState(null);
  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const { logout } = useAuth();
  const navigate   = useNavigate();

  useEffect(() => {
    api.get('/profile')
      .then(res => { setProfile(res.data); setName(res.data.name); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const body = { name };
      if (newPw) { body.currentPassword = currentPw; body.newPassword = newPw; }
      const res = await api.put('/profile', body);
      setProfile(prev => ({ ...prev, name: res.data.user.name }));
      setEditing(false); setCurrentPw(''); setNewPw('');
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  const inputStyle = { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}>
      <p style={{ color:'#64748b' }}>Loading profile...</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>
      {toast && (
        <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:999, background: toast.type==='error' ? '#fef2f2' : '#f0fdf4', border:`1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`, color: toast.type==='error' ? '#dc2626' : '#16a34a', padding:'0.75rem 1.25rem', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'500', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast.msg}
        </div>
      )}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer' }}>← Dashboard</button>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>👤 My Profile</span>
          </div>
          <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'2rem', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', marginBottom:'1.5rem' }}>
            <div style={{ width:'64px', height:'64px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'24px', color:'#fff', flexShrink:0 }}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.25rem' }}>{profile?.name}</h2>
              <p style={{ color:'#64748b', margin:0, fontSize:'0.875rem' }}>{profile?.email}</p>
            </div>
            <button onClick={() => setEditing(v => !v)} style={{ background: editing ? '#f1f5f9' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color: editing ? '#374151' : '#fff', padding:'0.5rem 1rem', borderRadius:'10px', fontSize:'0.85rem', cursor:'pointer', fontWeight:'500' }}>
              {editing ? 'Cancel' : '✏️ Edit'}
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom: editing ? '1.5rem' : 0 }}>
            {[
              { label:'Questions Asked', value: profile?.totalQuestions || 0, icon:'💬' },
              { label:'Study Sessions',  value: profile?.totalSessions  || 0, icon:'🗂️' },
              { label:'Courses',         value: profile?.enrollments?.length || 0, icon:'📚' },
            ].map(s => (
              <div key={s.label} style={{ background:'#f8fafc', borderRadius:'12px', padding:'1rem', textAlign:'center' }}>
                <div style={{ fontSize:'1.5rem', marginBottom:'0.35rem' }}>{s.icon}</div>
                <div style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0f172a' }}>{s.value}</div>
                <div style={{ fontSize:'0.75rem', color:'#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {editing && (
            <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Current password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Required to change password" style={inputStyle} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>New password <span style={{ color:'#94a3b8', fontWeight:'400' }}>(leave blank to keep current)</span></label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimum 8 characters" style={inputStyle} />
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ padding:'0.75rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes →'}
              </button>
            </div>
          )}
        </div>

        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
            <h3 style={{ fontWeight:'600', color:'#0f172a', margin:0, fontSize:'0.95rem' }}>Enrolled Courses</h3>
          </div>
          {profile?.enrollments?.length === 0 ? (
            <p style={{ textAlign:'center', color:'#94a3b8', padding:'2rem', margin:0 }}>No courses enrolled yet.</p>
          ) : profile?.enrollments?.map((e, i) => (
            <div key={i} style={{ padding:'0.875rem 1.5rem', borderBottom: i < profile.enrollments.length-1 ? '1px solid #f8fafc' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontWeight:'500', color:'#0f172a', fontSize:'0.875rem' }}>📖 {e.course.name}</span>
              <button onClick={() => navigate(`/chat/${e.course.id}`)} style={{ background:'none', border:'1px solid #e2e8f0', color:'#6366f1', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>
                Open chat →
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}