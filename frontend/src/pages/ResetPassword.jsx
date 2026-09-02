import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚠️</div>
        <h2 style={{ color:'#0f172a' }}>Invalid reset link</h2>
        <Link to="/forgot-password" style={{ color:'#6366f1', fontWeight:'600' }}>Request a new link →</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'52px', height:'52px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', fontSize:'24px' }}>🔒</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.25rem' }}>Reset Password</h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem', margin:0 }}>Enter your new password below</p>
        </div>

        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'2rem', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.07)' }}>
          {done ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
              <h3 style={{ color:'#0f172a', fontWeight:'600', margin:'0 0 0.5rem' }}>Password reset!</h3>
              <p style={{ color:'#64748b', fontSize:'0.9rem' }}>Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.75rem 1rem', borderRadius:'10px', fontSize:'0.875rem', marginBottom:'1.25rem' }}>
                  ⚠️ {error}
                </div>
              )}
              {[
                { label:'New password', val:password, set:setPassword, ph:'Minimum 8 characters' },
                { label:'Confirm password', val:confirm, set:setConfirm, ph:'Re-enter new password' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom:'1rem' }}>
                  <label style={{ display:'block', fontSize:'0.875rem', fontWeight:'500', color:'#374151', marginBottom:'0.5rem' }}>{f.label}</label>
                  <input type="password" value={f.val} onChange={e => f.set(e.target.value)} required placeholder={f.ph}
                    style={{ width:'100%', padding:'0.75rem 1rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.8rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.95rem', fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop:'0.5rem' }}>
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}