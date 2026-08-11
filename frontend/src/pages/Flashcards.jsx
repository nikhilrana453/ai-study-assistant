import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Flashcards() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [topic, setTopic]           = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [flipped, setFlipped]       = useState({});
  const [current, setCurrent]       = useState(0);

  const generate = async () => {
    setLoading(true);
    setError('');
    setFlashcards([]);
    setFlipped({});
    setCurrent(0);
    try {
      const res = await api.post('/flashcards/generate', { courseId, topic });
      setFlashcards(res.data.flashcards || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate flashcards.');
    } finally {
      setLoading(false);
    }
  };

  const flip = (i) => setFlipped(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>

      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate(`/chat/${courseId}`)} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer' }}>← Back to Chat</button>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>🃏 Flashcards</span>
          </div>
          <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Generate Form */}
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <h1 style={{ fontSize:'1.4rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.5rem' }}>🃏 Flashcard Generator</h1>
          <p style={{ color:'#64748b', margin:'0 0 1.25rem', fontSize:'0.9rem' }}>Generate 10 flashcards from your lecture notes. Click a card to flip it!</p>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Topic (optional) e.g. Security Controls..."
              style={{ flex:1, padding:'0.7rem 1rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.9rem', outline:'none' }}
            />
            <button onClick={generate} disabled={loading} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', padding:'0.7rem 1.5rem', borderRadius:'10px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' }}>
              {loading ? '⏳ Generating...' : 'Generate →'}
            </button>
          </div>
          {error && <p style={{ color:'#dc2626', fontSize:'0.85rem', margin:'0.75rem 0 0' }}>⚠️ {error}</p>}
        </div>

        {/* Progress */}
        {flashcards.length > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <span style={{ fontSize:'0.85rem', color:'#64748b' }}>Card {current + 1} of {flashcards.length}</span>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button onClick={() => setCurrent(v => Math.max(0, v-1))} disabled={current === 0} style={{ background:'#fff', border:'1px solid #e2e8f0', color:'#374151', padding:'0.4rem 0.875rem', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer', opacity: current === 0 ? 0.4 : 1 }}>← Prev</button>
              <button onClick={() => setCurrent(v => Math.min(flashcards.length-1, v+1))} disabled={current === flashcards.length-1} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', padding:'0.4rem 0.875rem', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer', opacity: current === flashcards.length-1 ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        )}

        {/* Current Card */}
        {flashcards.length > 0 && (
          <div style={{ marginBottom:'1.5rem' }}>
            <div
              onClick={() => flip(current)}
              style={{
                background: flipped[current] ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff',
                border: '1px solid #e2e8f0', borderRadius:'20px',
                padding:'3rem 2rem', textAlign:'center', cursor:'pointer',
                minHeight:'200px', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', transition:'all 0.3s',
                boxShadow:'0 4px 12px rgba(99,102,241,0.1)',
              }}
            >
              <span style={{ fontSize:'0.75rem', fontWeight:'600', color: flipped[current] ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                {flipped[current] ? 'Answer' : 'Question — Click to reveal answer'}
              </span>
              <p style={{ fontSize:'1.1rem', fontWeight:'600', color: flipped[current] ? '#fff' : '#0f172a', margin:0, lineHeight:'1.6' }}>
                {flipped[current] ? flashcards[current].back : flashcards[current].front}
              </p>
            </div>
          </div>
        )}

        {/* All Cards Grid */}
        {flashcards.length > 0 && (
          <div>
            <h3 style={{ fontSize:'0.9rem', fontWeight:'600', color:'#374151', marginBottom:'0.875rem' }}>All Flashcards</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'0.75rem' }}>
              {flashcards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => { setCurrent(i); flip(i); }}
                  style={{
                    background: flipped[i] ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff',
                    border:`1px solid ${current === i ? '#6366f1' : '#e2e8f0'}`,
                    borderRadius:'12px', padding:'1rem', cursor:'pointer', transition:'all 0.2s',
                    boxShadow: current === i ? '0 0 0 2px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  <p style={{ fontSize:'0.75rem', fontWeight:'600', color: flipped[i] ? 'rgba(255,255,255,0.7)' : '#94a3b8', margin:'0 0 0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {flipped[i] ? 'Answer' : `Card ${i + 1}`}
                  </p>
                  <p style={{ fontSize:'0.85rem', color: flipped[i] ? '#fff' : '#374151', margin:0, lineHeight:'1.5', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>
                    {flipped[i] ? card.back : card.front}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}