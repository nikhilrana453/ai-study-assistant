import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';

export default function Summariser() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const { logout }   = useAuth();
  const [summary, setSummary]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [courseName, setCourseName]   = useState('');
  const [error, setError]             = useState('');
  const [chunksUsed, setChunksUsed]   = useState(0);

  useEffect(() => {
    api.get('/courses/my-courses').then(res => {
      const c = res.data.find(c => c.id === courseId);
      if (c) setCourseName(c.name);
    }).catch(() => {});
  }, [courseId]);

  const summarise = async () => {
    setLoading(true); setError(''); setSummary('');
    try {
      const res = await api.post('/materials/summarise', { courseId });
      setSummary(res.data.summary);
      setChunksUsed(res.data.chunksUsed);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to summarise. Upload lecture notes first.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate(`/chat/${courseId}`)} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer' }}>← Back to Chat</button>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>📄 Lecture Summariser</span>
          </div>
          <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'2rem', marginBottom:'1.5rem', textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📄</div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.5rem' }}>Lecture Summariser</h1>
          <p style={{ color:'#64748b', margin:'0 0 1.5rem', fontSize:'0.9rem' }}>
            Generate a smart summary of all uploaded notes for <strong>{courseName}</strong>
          </p>
          <button onClick={summarise} disabled={loading} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', padding:'0.75rem 2rem', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Generating summary...' : '✨ Generate Summary'}
          </button>
          {error && <p style={{ color:'#dc2626', marginTop:'1rem', fontSize:'0.875rem' }}>⚠️ {error}</p>}
        </div>

        {summary && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', paddingBottom:'1rem', borderBottom:'1px solid #f1f5f9' }}>
              <h2 style={{ fontSize:'0.95rem', fontWeight:'600', color:'#0f172a', margin:0 }}>📋 Summary — {courseName}</h2>
              <span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:'0.75rem', padding:'0.2rem 0.6rem', borderRadius:'20px' }}>{chunksUsed} chunks used</span>
            </div>
            <div style={{ fontSize:'0.9rem', color:'#0f172a', lineHeight:'1.75' }}>
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}