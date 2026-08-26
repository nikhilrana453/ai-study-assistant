import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';


// ── Helper: parse sources from DB (stored as JSON) ───────────
const parseSources = (sources) => {
  if (!sources) return [];
  if (Array.isArray(sources)) return sources;
  try { return JSON.parse(sources); } catch { return []; }
};

export default function Chat() {
  const { courseId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]                 = useState([]);
  const [sessions, setSessions]                 = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput]                       = useState('');
  const [loading, setLoading]                   = useState(false);
  const [hintMode, setHintMode]                 = useState(false);
  const [courseName, setCourseName]             = useState('');
  const [error, setError]                       = useState('');
  const [showSidebar, setShowSidebar]           = useState(true);
  const [sessionLoading, setSessionLoading]     = useState(false);
  const [feedbacks, setFeedbacks]               = useState({});
  const [bookmarks, setBookmarks]               = useState({});
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const { dark, toggle, theme } = useTheme();


  // ── Load course + sessions + latest history ───────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const coursesRes = await api.get('/courses/my-courses');
        const course = coursesRes.data.find(c => c.id === courseId);
        if (course) setCourseName(course.name);

        const sessionsRes = await api.get(`/chat/sessions?courseId=${courseId}`);
        const allSessions = sessionsRes.data;
        setSessions(allSessions);

        if (allSessions.length > 0) {
          const latest = allSessions[0];
          try {
            const histRes = await api.get(`/chat/history?courseId=${courseId}&sessionId=${latest.id}`);
            if (histRes.data.messages?.length > 0) {
              setMessages(histRes.data.messages);
              setCurrentSessionId(histRes.data.sessionId || latest.id);
            } else {
              setCurrentSessionId(latest.id);
            }
          } catch {
            setCurrentSessionId(latest.id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [courseId]);

  // ── Auto scroll ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto resize textarea ──────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // ── Feedback ──────────────────────────────────────────────
  const submitFeedback = async (messageId, rating) => {
    try {
      await api.post('/feedback', { messageId, rating });
      setFeedbacks(prev => ({ ...prev, [messageId]: rating }));
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  // ── Bookmark ──────────────────────────────────────────────
  const toggleBookmark = async (messageId) => {
    try {
      const res = await api.post('/bookmarks', { messageId, courseId });
      setBookmarks(prev => ({ ...prev, [messageId]: res.data.bookmarked }));
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  // ── Send message with streaming ───────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setError('');
    setLoading(true);

    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user', content: question, createdAt: new Date().toISOString(),
    }]);

    // Add empty AI placeholder
    setMessages(prev => [...prev, {
      role: 'assistant', content: '', sources: [], streaming: true,
      id: null, createdAt: new Date().toISOString(),
    }]);

    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : 'http://localhost:5000';

      const response = await fetch(`${baseURL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          courseId,
          hintMode,
          sessionId: currentSessionId, // null = new chat, value = continue
        })
      });

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';
      let sources    = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            // Sources + sessionId received before streaming starts
            if (data.sources !== undefined) sources = data.sources;
            if (data.sessionId && !currentSessionId) {
              setCurrentSessionId(data.sessionId);
            }

            // Each word token
            if (data.token) {
              fullAnswer += data.token;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant', content: fullAnswer,
                  sources, streaming: true, id: null,
                  createdAt: new Date().toISOString(),
                };
                return updated;
              });
            }

            // Streaming complete
            if (data.done) {
              const messageId = data.messageId || null;
              const sessionId = data.sessionId || currentSessionId;

              // Always update sessionId from backend
              if (sessionId) setCurrentSessionId(sessionId);

              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role:      'assistant',
                  content:   fullAnswer,
                  sources,
                  streaming: false,
                  id:        messageId, // ← enables feedback + bookmark
                  createdAt: new Date().toISOString(),
                };
                return updated;
              });

              // Refresh sessions sidebar
              const sessRes = await api.get(`/chat/sessions?courseId=${courseId}`);
              setSessions(sessRes.data);
            }

          } catch (e) { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          sources: [], streaming: false, id: null,
          createdAt: new Date().toISOString(),
        };
        return updated;
      });
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Load past session ─────────────────────────────────────
  const loadSession = async (session) => {
    setCurrentSessionId(session.id);
    setError('');
    setSessionLoading(true);
    try {
      const res = await api.get(`/chat/history?courseId=${courseId}&sessionId=${session.id}`);
      if (res.data.messages?.length > 0) {
        setMessages(res.data.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Load session error:', err);
      setMessages([]);
    } finally {
      setSessionLoading(false);
    }
  };

  // ── New Chat ──────────────────────────────────────────────
  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null); // null → backend creates new session
    setInput('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const suggestions = [
    'What are the key topics this week?',
    'Explain the main concepts',
    'What should I focus on?',
    'Give me a summary',
  ];

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#f8fafc', fontFamily:'system-ui,sans-serif', overflow:'hidden' }}>
      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
        .msg-ai   { background:#fff; border:1px solid #e2e8f0; border-radius:18px 18px 18px 4px; }
        .msg-user { background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:18px 18px 4px 18px; }
        .session-item:hover { background:#f1f5f9 !important; }
        .chip:hover { border-color:#6366f1 !important; color:#6366f1 !important; background:#eff6ff !important; }
        .ai-content p  { margin:0.2rem 0; line-height:1.65; }
        .ai-content ul { margin:0.2rem 0; padding-left:1.2rem; }
        .ai-content li { margin:0.1rem 0; line-height:1.65; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(99,115,145,0.2); border-radius:4px; }
        textarea { font-family:system-ui,sans-serif !important; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1rem', flexShrink:0, zIndex:100, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            <button onClick={() => setShowSidebar(v => !v)} style={{ background:'#f1f5f9', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>☰</button>
            <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.8rem', cursor:'pointer' }}>← Back</button>
            <div style={{ width:'1px', height:'20px', background:'#e2e8f0' }} />
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <div style={{ width:'24px', height:'24px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px' }}>📚</div>
              <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>{courseName || 'Loading...'}</span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <button onClick={() => navigate(`/quiz/${courseId}`)} style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', color:'#7c3aed', padding:'0.3rem 0.7rem', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:'500' }}>🧠 Quiz</button>
            <button onClick={() => navigate(`/flashcards/${courseId}`)} style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', color:'#059669', padding:'0.3rem 0.7rem', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:'500' }}>🃏 Flashcards</button>
            <button onClick={() => navigate('/bookmarks')} style={{ background:'#fefce8', border:'1px solid #fde68a', color:'#d97706', padding:'0.3rem 0.7rem', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:'500' }}>🔖 Saved</button>
            <div style={{ width:'1px', height:'20px', background:'#e2e8f0' }} />
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <span style={{ fontSize:'0.78rem', color:'#64748b' }}>Hint</span>
              <button onClick={() => setHintMode(v => !v)} style={{ width:'38px', height:'21px', borderRadius:'11px', border:'none', cursor:'pointer', background: hintMode ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0', position:'relative', transition:'background 0.2s' }}>
                <span style={{ position:'absolute', top:'2.5px', left: hintMode ? '19px' : '2.5px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              {hintMode && <span style={{ background:'#fef3c7', color:'#92400e', fontSize:'0.68rem', fontWeight:'600', padding:'0.15rem 0.45rem', borderRadius:'20px' }}>ON</span>}
            </div>
            <div style={{ width:'1px', height:'20px', background:'#e2e8f0' }} />
            <div style={{ width:'28px', height:'28px', background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'12px', color:'#6366f1' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize:'0.82rem', color:'#475569' }}>{user?.name}</span>
            <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.7rem', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:'500' }}>Sign out</button>
            <button onClick={toggle} style={{ background:'#f1f5f9', border:'none', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'16px' }}>
            {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* SIDEBAR */}
        {showSidebar && (
          <div style={{ width:'235px', background:'#fff', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>
            <div style={{ padding:'0.875rem', borderBottom:'1px solid #f1f5f9' }}>
              <button onClick={startNewChat} style={{ width:'100%', padding:'0.6rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'10px', color:'#fff', fontWeight:'600', fontSize:'0.875rem', cursor:'pointer' }}>
                + New Chat
              </button>
            </div>
            <div style={{ padding:'0.5rem 0.75rem 0.25rem' }}>
              <span style={{ fontSize:'0.68rem', fontWeight:'600', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>Recent Chats</span>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'0.25rem 0.625rem 1rem' }}>
              {sessions.length === 0 ? (
                <p style={{ fontSize:'0.8rem', color:'#94a3b8', textAlign:'center', padding:'1rem 0.5rem', margin:0 }}>No chats yet</p>
              ) : sessions.map(session => (
                <button
                  key={session.id}
                  className="session-item"
                  onClick={() => loadSession(session)}
                  style={{ width:'100%', textAlign:'left', padding:'0.6rem 0.75rem', borderRadius:'10px', border: currentSessionId===session.id ? '1px solid #bfdbfe' : '1px solid transparent', cursor:'pointer', marginBottom:'0.2rem', background: currentSessionId===session.id ? '#eff6ff' : 'none', transition:'all 0.15s' }}
                >
                  <div style={{ fontSize:'0.8rem', fontWeight:'600', color: currentSessionId===session.id ? '#3b82f6' : '#374151', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:'0.15rem' }}>
                    {session.messages?.[0]?.content?.substring(0, 28) || 'New chat'}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAIN CHAT */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* Messages scroll area */}
          <div style={{ flex:1, overflowY:'auto', padding:'1.5rem 1.5rem 1rem' }}>
            <div style={{ maxWidth:'780px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

              {/* Session loading */}
              {sessionLoading && (
                <div style={{ textAlign:'center', padding:'3rem' }}>
                  <div style={{ display:'flex', gap:'0.375rem', alignItems:'center', justifyContent:'center' }}>
                    {[0,150,300].map(d => <div key={d} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#6366f1', animation:'bounce 1.2s infinite', animationDelay:`${d}ms` }} />)}
                  </div>
                  <p style={{ color:'#94a3b8', fontSize:'0.85rem', marginTop:'0.75rem' }}>Loading chat history...</p>
                </div>
              )}

              {/* Empty state */}
              {!sessionLoading && messages.length === 0 && (
                <div style={{ textAlign:'center', padding:'4rem 1rem' }}>
                  <div style={{ width:'56px', height:'56px', background:'#eff6ff', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', fontSize:'26px' }}>💬</div>
                  <h2 style={{ fontSize:'1.2rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.5rem' }}>Ask your AI tutor</h2>
                  <p style={{ color:'#64748b', fontSize:'0.9rem', margin:'0 0 1.5rem', maxWidth:'320px', marginLeft:'auto', marginRight:'auto' }}>
                    {hintMode ? '💡 Hint mode is ON — I will guide you without giving direct answers' : 'I answer exclusively from your uploaded lecture notes.'}
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', justifyContent:'center' }}>
                    {suggestions.map(s => (
                      <button key={s} className="chip" onClick={() => setInput(s)} style={{ background:'#fff', border:'1px solid #e2e8f0', color:'#475569', padding:'0.45rem 0.9rem', borderRadius:'20px', fontSize:'0.8rem', cursor:'pointer', transition:'all 0.15s' }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* MESSAGES */}
              {!sessionLoading && messages.map((msg, i) => (
                <div key={i} style={{ display:'flex', justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start' }}>

                  {/* AI Avatar */}
                  {msg.role==='assistant' && (
                    <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0, marginRight:'0.625rem', marginTop:'2px' }}>🤖</div>
                  )}

                  <div style={{ maxWidth:'75%' }}>

                    {/* Bubble */}
                    <div className={msg.role==='user' ? 'msg-user' : 'msg-ai'} style={{ padding:'0.75rem 1rem', fontSize:'0.9rem', lineHeight:'1.65' }}>
                      {msg.role==='user' ? (
                        <p style={{ margin:0, color:'#fff', whiteSpace:'pre-wrap' }}>{msg.content}</p>
                      ) : (
                        <div className="ai-content" style={{ color:'#0f172a' }}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {msg.streaming && (
                            <span style={{ display:'inline-block', width:'8px', height:'15px', background:'#6366f1', marginLeft:'2px', verticalAlign:'middle', animation:'blink 1s infinite', borderRadius:'2px' }} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sources — uses parseSources() to handle DB JSON format */}
                    {msg.role==='assistant' && parseSources(msg.sources).length > 0 && (
                      <div style={{ marginTop:'0.5rem', padding:'0.5rem 0.75rem', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px', display:'flex', alignItems:'flex-start', gap:'0.5rem' }}>
                        <span>📚</span>
                        <div>
                          <p style={{ fontSize:'0.7rem', fontWeight:'600', color:'#92400e', margin:'0 0 0.1rem' }}>Sources Used</p>
                          {parseSources(msg.sources).map((src, si) => (
                            <p key={si} style={{ fontSize:'0.75rem', color:'#78350f', margin:'0.05rem 0' }}>• {src}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FEEDBACK + BOOKMARK — only when msg.id exists */}
                    {msg.role==='assistant' && !msg.streaming && msg.id && (
                      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.5rem', paddingLeft:'0.25rem' }}>
                        <button
                          onClick={() => submitFeedback(msg.id, 1)}
                          style={{ background: feedbacks[msg.id]===1 ? '#dcfce7' : '#f1f5f9', border:`1px solid ${feedbacks[msg.id]===1 ? '#86efac' : '#e2e8f0'}`, color: feedbacks[msg.id]===1 ? '#16a34a' : '#64748b', padding:'0.25rem 0.6rem', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.25rem', transition:'all 0.15s' }}
                        >
                          👍 {feedbacks[msg.id]===1 ? 'Helpful' : ''}
                        </button>
                        <button
                          onClick={() => submitFeedback(msg.id, -1)}
                          style={{ background: feedbacks[msg.id]===-1 ? '#fef2f2' : '#f1f5f9', border:`1px solid ${feedbacks[msg.id]===-1 ? '#fca5a5' : '#e2e8f0'}`, color: feedbacks[msg.id]===-1 ? '#dc2626' : '#64748b', padding:'0.25rem 0.6rem', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.25rem', transition:'all 0.15s' }}
                        >
                          👎 {feedbacks[msg.id]===-1 ? 'Not helpful' : ''}
                        </button>
                        <button
                          onClick={() => toggleBookmark(msg.id)}
                          style={{ background: bookmarks[msg.id] ? '#fefce8' : '#f1f5f9', border:`1px solid ${bookmarks[msg.id] ? '#fde68a' : '#e2e8f0'}`, color: bookmarks[msg.id] ? '#d97706' : '#64748b', padding:'0.25rem 0.6rem', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.25rem', marginLeft:'auto', transition:'all 0.15s' }}
                        >
                          {bookmarks[msg.id] ? '🔖 Saved' : '🔖 Save'}
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p style={{ fontSize:'0.68rem', color:'#94a3b8', margin:'0.25rem 0.25rem 0', textAlign: msg.role==='user' ? 'right' : 'left' }}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : ''}
                    </p>
                  </div>

                  {/* User Avatar */}
                  {msg.role==='user' && (
                    <div style={{ width:'32px', height:'32px', background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'13px', color:'#6366f1', flexShrink:0, marginLeft:'0.625rem', marginTop:'2px' }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking dots */}
              {loading && messages[messages.length-1]?.content==='' && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:'0.625rem' }}>
                  <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>🤖</div>
                  <div className="msg-ai" style={{ padding:'0.875rem 1rem' }}>
                    <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                      {[0,150,300].map(d => <div key={d} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#6366f1', animation:'bounce 1.2s infinite', animationDelay:`${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.75rem 1rem', borderRadius:'12px', fontSize:'0.85rem', textAlign:'center' }}>
                  ⚠️ {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Hint badge */}
          {hintMode && (
            <div style={{ display:'flex', justifyContent:'center', paddingBottom:'0.5rem' }}>
              <span style={{ background:'#fef3c7', border:'1px solid #fde68a', color:'#92400e', borderRadius:'20px', padding:'0.3rem 0.875rem', fontSize:'0.75rem', fontWeight:'600' }}>
                💡 Hint mode on — guiding you, not answering directly
              </span>
            </div>
          )}

          {/* INPUT */}
          <div style={{ background:'#fff', borderTop:'1px solid #e2e8f0', padding:'1rem 1.5rem 1.25rem' }}>
            <div style={{ maxWidth:'780px', margin:'0 auto' }}>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'0.75rem', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'16px', padding:'0.75rem 0.875rem' }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={hintMode ? '💡 Ask for a hint...' : '💬 Ask a question about your course...'}
                  rows={1}
                  disabled={loading}
                  style={{ flex:1, resize:'none', background:'transparent', border:'none', outline:'none', fontSize:'0.9rem', color:'#0f172a', lineHeight:'1.5', minHeight:'24px', maxHeight:'120px', opacity: loading ? 0.5 : 1 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  style={{ width:'36px', height:'36px', background: (!input.trim()||loading) ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'10px', cursor: (!input.trim()||loading) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0, transition:'all 0.15s' }}
                >
                  {loading ? '⏳' : '➤'}
                </button>
              </div>
              <p style={{ fontSize:'0.72rem', color:'#94a3b8', textAlign:'center', margin:'0.5rem 0 0' }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
