import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'52px', height:'52px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', fontSize:'24px' }}>📚</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.25rem' }}>AI Study Assistant</h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem', margin:0 }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'2rem', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.07)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.75rem 1rem', borderRadius:'10px', fontSize:'0.875rem', marginBottom:'1.25rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.875rem', fontWeight:'500', color:'#374151', marginBottom:'0.5rem' }}>Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@student.op.ac.nz"
                style={{ width:'100%', padding:'0.75rem 1rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', color:'#0f172a' }}
              />
            </div>

            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:'0.875rem', fontWeight:'500', color:'#374151', marginBottom:'0.5rem' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width:'100%', padding:'0.75rem 1rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', color:'#0f172a' }}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{ width:'100%', padding:'0.8rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.95rem', fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'#6366f1', fontWeight:'600', textDecoration:'none' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}