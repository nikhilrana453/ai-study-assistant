import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';

export default function SearchChats() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/chat/search?q=${encodeURIComponent(query)}`);
      setResults(res.data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer' }}>← Dashboard</button>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>🔍 Search Past Chats</span>
          </div>
          <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem' }}>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search your chat history e.g. security controls..."
            style={{ flex:1, padding:'0.75rem 1rem', border:'1px solid #d1d5db', borderRadius:'12px', fontSize:'0.9rem', outline:'none' }}
          />
          <button onClick={search} disabled={loading || !query.trim()}
            style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', padding:'0.75rem 1.5rem', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer', opacity: (loading || !query.trim()) ? 0.6 : 1 }}>
            {loading ? '...' : '🔍 Search'}
          </button>
        </div>

        {searched && !loading && results.length === 0 && (
          <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🔍</div>
            <p>No results found for "{query}"</p>
          </div>
        )}

        {!searched && (
          <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>💬</div>
            <p>Type a keyword to search your past conversations</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {results.map((msg, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.25rem 1.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                <span style={{ background: msg.role==='user' ? '#eff6ff' : '#ecfdf5', color: msg.role==='user' ? '#1d4ed8' : '#065f46', fontSize:'0.75rem', fontWeight:'600', padding:'0.2rem 0.6rem', borderRadius:'20px' }}>
                  {msg.role === 'user' ? '👤 Your question' : '🤖 AI answer'}
                </span>
                <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>
                  {new Date(msg.createdAt).toLocaleDateString('en-NZ', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
              <div style={{ fontSize:'0.875rem', color:'#0f172a', lineHeight:'1.6' }}>
                {msg.role === 'assistant'
                  ? <ReactMarkdown>{msg.content.substring(0, 250) + (msg.content.length > 250 ? '...' : '')}</ReactMarkdown>
                  : <p style={{ margin:0 }}>{msg.content}</p>
                }
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}