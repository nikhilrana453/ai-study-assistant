import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookmarks')
      .then(res => setBookmarks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const removeBookmark = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>
      <style>{`.ai-content p{margin:0.2rem 0} .ai-content ul{padding-left:1.2rem}`}</style>

      {/* Navbar */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer' }}>← Back</button>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>🔖 Saved Answers</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ fontSize:'0.85rem', color:'#64748b' }}>{user?.name}</span>
            <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>Sign out</button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ marginBottom:'1.5rem' }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.35rem' }}>Saved Answers</h1>
          <p style={{ color:'#64748b', margin:0, fontSize:'0.9rem' }}>AI answers you have bookmarked for quick reference.</p>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#64748b' }}>Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'4rem', textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔖</div>
            <h3 style={{ color:'#374151', fontWeight:'600', margin:'0 0 0.5rem' }}>No saved answers yet</h3>
            <p style={{ color:'#9ca3af', margin:0, fontSize:'0.875rem' }}>Bookmark AI answers in chat to save them here.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {bookmarks.map(bookmark => (
              <div key={bookmark.id} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.25rem 1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem' }}>
                  <span style={{ background:'#fefce8', border:'1px solid #fde68a', color:'#92400e', fontSize:'0.75rem', fontWeight:'600', padding:'0.2rem 0.6rem', borderRadius:'20px' }}>
                    🔖 Saved {new Date(bookmark.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => removeBookmark(bookmark.id)}
                    style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.25rem 0.6rem', borderRadius:'8px', fontSize:'0.75rem', cursor:'pointer' }}
                  >
                    Remove
                  </button>
                </div>
                <div className="ai-content" style={{ fontSize:'0.9rem', color:'#0f172a', lineHeight:'1.65' }}>
                  <ReactMarkdown>{bookmark.message?.content || ''}</ReactMarkdown>
                </div>
                {bookmark.message?.sources && (
                  <div style={{ marginTop:'0.75rem', padding:'0.5rem 0.75rem', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px', fontSize:'0.75rem', color:'#92400e' }}>
                    📚 {Array.isArray(bookmark.message.sources) ? bookmark.message.sources.join(', ') : bookmark.message.sources}
                  </div>
                )}
                <button
                  onClick={() => navigate(`/chat/${bookmark.courseId}`)}
                  style={{ marginTop:'0.875rem', background:'none', border:'1px solid #e2e8f0', color:'#6366f1', padding:'0.4rem 0.875rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'500' }}
                >
                  Open in chat →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}