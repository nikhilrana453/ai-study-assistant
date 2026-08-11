import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm]       = useState({ name:'', email:'', password:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'52px', height:'52px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', fontSize:'24px' }}>📚</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.25rem' }}>Create Account</h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem', margin:0 }}>Join AI Study Assistant</p>
        </div>

        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'2rem', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.07)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.75rem 1rem', borderRadius:'10px', fontSize:'0.875rem', marginBottom:'1.25rem' }}>
                ⚠️ {error}
              </div>
            )}

            {[
              { label:'Full name', key:'name', type:'text', placeholder:'Nikhil Rana' },
              { label:'Email address', key:'email', type:'email', placeholder:'you@student.op.ac.nz' },
              { label:'Password', key:'password', type:'password', placeholder:'Minimum 8 characters' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:'0.875rem', fontWeight:'500', color:'#374151', marginBottom:'0.5rem' }}>{field.label}</label>
                <input
                  type={field.type} placeholder={field.placeholder} required
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width:'100%', padding:'0.75rem 1rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', color:'#0f172a' }}
                />
              </div>
            ))}

            <button
              type="submit" disabled={loading}
              style={{ width:'100%', padding:'0.8rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.95rem', fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop:'0.5rem' }}
            >
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'#6366f1', fontWeight:'600', textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
