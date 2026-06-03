import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ─── Light, eye-friendly palette ─────────────────────────────────────────────
const C = {
  bg:          '#f5f6fa',   // soft off-white page background
  bgNav:       '#ffffff',   // crisp white nav
  bgSidebar:   '#f0f2f8',   // slightly tinted sidebar
  bgCard:      '#ffffff',   // white message cards
  bgInput:     '#ffffff',   // white input area
  bgInputInner:'#f8f9fc',   // very light textarea
  border:      'rgba(99,115,145,0.14)',
  borderLight: 'rgba(99,115,145,0.08)',
  textPrimary: '#1e293b',   // dark slate — easy to read on white
  textSecond:  '#475569',   // medium slate
  textMuted:   '#94a3b8',   // muted labels
  amber:       '#d97706',   // slightly deeper amber for contrast on white
  amberDark:   '#b45309',
  amberBg:     'rgba(217,119,6,0.07)',
  amberBorder: 'rgba(217,119,6,0.20)',
  red:         '#ef4444',
};

const S = {
  page: {
    height: '100vh',
    overflow: 'hidden',
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    color: C.textPrimary,
  },
  nav: {
    background: C.bgNav,
    borderBottom: `1px solid ${C.border}`,
    boxShadow: '0 1px 3px rgba(30,41,59,0.06)',
    padding: '0.8rem 1.5rem',
    flexShrink: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: '1300px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLeft:  { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  menuBtn: {
    background: 'rgba(148,163,184,0.07)',
    border: `1px solid ${C.border}`,
    color: C.textSecond,
    width: '32px', height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px',
  },
  backBtn: {
    background: 'none', border: 'none',
    color: C.textMuted,
    fontSize: '0.8125rem', cursor: 'pointer',
    padding: '0.25rem 0.5rem', borderRadius: '6px',
  },
  courseTitle: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontWeight: '700', fontSize: '1rem',
    color: C.textPrimary, letterSpacing: '-0.01em',
  },
  hintToggle: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'rgba(148,163,184,0.05)',
    border: `1px solid ${C.border}`,
    borderRadius: '20px', padding: '0.35rem 0.75rem',
  },
  hintLabel: { fontSize: '0.8125rem', color: C.textMuted },
  toggleTrack: (on) => ({
    width: '34px', height: '19px', borderRadius: '10px',
    background: on ? C.amber : 'rgba(148,163,184,0.15)',
    position: 'relative', cursor: 'pointer', border: 'none',
    transition: 'background 0.2s', flexShrink: 0,
  }),
  toggleThumb: (on) => ({
    position: 'absolute', top: '2.5px',
    left: on ? '16px' : '2.5px',
    width: '14px', height: '14px',
    borderRadius: '50%', background: 'white',
    transition: 'left 0.2s',
  }),
  hintBadge: {
    fontSize: '0.6875rem',
    background: 'rgba(217,119,6,0.10)', color: '#b45309',
    padding: '0.175rem 0.5rem', borderRadius: '20px', fontWeight: '600',
  },
  userName:  { fontSize: '0.875rem', color: C.textSecond },
  logoutBtn: {
    background: 'rgba(239,68,68,0.07)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#dc2626',
    padding: '0.35rem 0.875rem', borderRadius: '8px',
    fontSize: '0.8125rem', cursor: 'pointer', fontWeight: '500',
  },

  // ── Layout ──────────────────────────────────────────────────
  body: {
    display: 'flex', flex: 1,
    width: '100%', overflow: 'hidden', minHeight: 0,
  },
  sidebar: {
    width: '255px',
    borderRight: `1px solid ${C.border}`,
    boxShadow: '1px 0 0 rgba(99,115,145,0.08)',
    display: 'flex', flexDirection: 'column',
    flexShrink: 0,
    background: C.bgSidebar,
    height: '100%', overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '0.875rem 0.875rem',
    borderBottom: `1px solid ${C.borderLight}`,
    flexShrink: 0,
  },
  newChatBtn: {
    width: '100%', padding: '0.6rem',
    background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
    border: 'none', borderRadius: '10px',
    color: '#ffffff', fontWeight: '700', fontSize: '0.875rem',
    cursor: 'pointer', letterSpacing: '0.01em',
  },
  sidebarList: {
    flex: 1, overflowY: 'auto',
    padding: '0.5rem 0.625rem',
    minHeight: 0,
  },
  sidebarLabel: {
    fontSize: '0.6875rem', color: C.textMuted,
    fontWeight: '600', letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0.375rem 0.5rem 0.5rem',
    display: 'block',
  },
  sessionBtn: (active) => ({
    width: '100%', textAlign: 'left',
    padding: '0.55rem 0.75rem', borderRadius: '9px',
    border: active ? `1px solid ${C.amberBorder}` : '1px solid transparent',
    background: active ? C.amberBg : 'none',
    color: active ? C.amber : C.textSecond,
    cursor: 'pointer', marginBottom: '0.2rem',
    transition: 'all 0.15s',
  }),
  sessionName: {
    fontSize: '0.8125rem', fontWeight: '600',
    marginBottom: '0.15rem', display: 'block',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  sessionDate: { fontSize: '0.6875rem', opacity: 0.55 },

  // ── Main chat area ───────────────────────────────────────────
  main: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', minWidth: 0,
    padding: '1.25rem 1.5rem 1.25rem',
    gap: '1rem',
  },
  messagesWrap: {
    flex: 1, overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
    gap: '0.875rem',
    paddingRight: '0.375rem',
    minHeight: 0,
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '3rem 1rem',
  },
  emptyIcon:  { fontSize: '2.75rem', marginBottom: '0.875rem' },
  emptyTitle: {
    fontSize: '1.2rem', fontWeight: '700', color: C.textSecond,
    fontFamily: '"Playfair Display", Georgia, serif',
    marginBottom: '0.4rem',
  },
  emptyHint:  { fontSize: '0.875rem', color: C.textMuted, marginBottom: '1.5rem' },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' },
  suggestion: {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    color: C.textSecond,
    padding: '0.45rem 0.9rem', borderRadius: '20px',
    fontSize: '0.8125rem', cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // ── Messages ─────────────────────────────────────────────────
  msgRow:    (u) => ({ display: 'flex', justifyContent: u ? 'flex-end' : 'flex-start' }),
  msgBubble: (u) => ({
    maxWidth: '72%',
    padding: '0.7rem 0.9rem',
    borderRadius: u ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    fontSize: '0.9375rem', lineHeight: '1.65',
    background: u ? `linear-gradient(135deg, ${C.amber}, ${C.amberDark})` : C.bgCard,
    color: u ? '#ffffff' : C.textPrimary,
    border: u ? 'none' : `1px solid ${C.border}`,
    fontWeight: u ? '500' : '400',
  }),
  msgHeader: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    marginBottom: '0.45rem', paddingBottom: '0.45rem',
    borderBottom: `1px solid ${C.borderLight}`,
  },
  msgLabel:   { fontSize: '0.75rem', fontWeight: '600', color: C.textMuted, letterSpacing: '0.02em' },
  sources: {
    marginTop: '0.5rem', padding: '0.55rem 0.75rem',
    background: C.amberBg,
    border: `1px solid ${C.amberBorder}`,
    borderRadius: '10px',
  },
  sourcesLabel: { fontSize: '0.75rem', fontWeight: '600', color: C.amber, marginBottom: '0.3rem' },
  sourceItem:   { fontSize: '0.75rem', color: C.textSecond, margin: '0.1rem 0' },
  timestamp: (u) => ({
    fontSize: '0.6875rem', color: C.textMuted,
    marginTop: '0.25rem', textAlign: u ? 'right' : 'left',
  }),
  loadingBubble: {
    background: C.bgCard, border: `1px solid ${C.border}`,
    padding: '0.7rem 0.9rem',
    borderRadius: '16px 16px 16px 4px',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  },
  loadingText: { fontSize: '0.8125rem', color: C.textMuted },
  dot: (delay) => ({
    width: '5px', height: '5px', borderRadius: '50%',
    background: C.amber,
    animation: 'bounce 1.2s ease-in-out infinite',
    animationDelay: delay,
  }),
  errorBanner: {
    textAlign: 'center',
    background: 'rgba(239,68,68,0.07)',
    border: '1px solid rgba(239,68,68,0.18)',
    color: '#fca5a5',
    padding: '0.65rem', borderRadius: '10px', fontSize: '0.875rem',
  },

  // ── Input ────────────────────────────────────────────────────
  inputArea: {
    background: C.bgInput,
    border: `1px solid ${C.border}`,
    borderRadius: '14px', padding: '0.875rem',
    flexShrink: 0,
  },
  textarea: {
    width: '100%', resize: 'none',
    background: 'transparent', border: 'none', outline: 'none',
    fontSize: '0.9375rem', color: C.textPrimary,
    lineHeight: '1.6', boxSizing: 'border-box',
    caretColor: C.amber,
  },
  inputFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '0.625rem', paddingTop: '0.625rem',
    borderTop: `1px solid ${C.borderLight}`,
  },
  inputHint: { fontSize: '0.75rem', color: C.textMuted },
  sendBtn: {
    background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
    border: 'none', color: '#ffffff',
    fontWeight: '700', fontSize: '0.875rem',
    padding: '0.5rem 1.25rem', borderRadius: '9px',
    cursor: 'pointer', letterSpacing: '0.01em',
    transition: 'opacity 0.2s',
  },
};

export default function Chat() {
  const { courseId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]             = useState([]);
  const [sessions, setSessions]             = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [hintMode, setHintMode]             = useState(false);
  const [courseName, setCourseName]         = useState('');
  const [error, setError]                   = useState('');
  const [showSidebar, setShowSidebar]       = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const bottomRef = useRef(null);

  // ── Load course name + sessions list + most recent chat history ──
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Course name
        const coursesRes = await api.get('/courses/my-courses');
        const course = coursesRes.data.find(c => c.id === courseId);
        if (course) setCourseName(course.name);

        // 2. All sessions for this course
        const sessionsRes = await api.get(`/chat/sessions?courseId=${courseId}`);
        const allSessions = sessionsRes.data;
        setSessions(allSessions);

        // 3. Auto-load the most recent session via history endpoint (most reliable)
        if (allSessions.length > 0) {
          const latest = allSessions[0];
          try {
            // Fetch full messages for the latest session by sessionId
            const historyRes = await api.get(`/chat/history?courseId=${courseId}&sessionId=${latest.id}`);
            if (historyRes.data.messages && historyRes.data.messages.length > 0) {
              setMessages(historyRes.data.messages);
              setCurrentSessionId(historyRes.data.sessionId || latest.id);
            } else {
              // Session exists but is empty — just select it
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/chat/message', {
        question: currentInput,
        courseId,
        hintMode,
        ...(currentSessionId ? { sessionId: currentSessionId } : {}),
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources || [],
      }]);
      setCurrentSessionId(res.data.sessionId);
      const sessionsRes = await api.get(`/chat/sessions?courseId=${courseId}`);
      setSessions(sessionsRes.data);
    } catch (err) {
      setError('Failed to get response. Make sure Ollama is running.');
      setMessages(prev => prev.slice(0, -1));
      setInput(currentInput);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (session) => {
    setCurrentSessionId(session.id);
    setError('');
    setSessionLoading(true);
    try {
      // Always fetch from API — sessions list doesn't embed full messages
      const res = await api.get(`/chat/history?courseId=${courseId}&sessionId=${session.id}`);
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages);
      } else if (session.messages && session.messages.length > 0) {
        // Fallback to whatever the sessions list has
        setMessages(session.messages);
      } else {
        setMessages([]);
      }
    } catch {
      // Fallback to embedded messages on error
      setMessages(session.messages || []);
    } finally {
      setSessionLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        .session-btn:hover { background: rgba(148,163,184,0.06) !important; }
        .suggestion:hover  { border-color: rgba(245,158,11,0.35) !important; color: #f59e0b !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,115,145,0.22); border-radius: 4px; }
        textarea::placeholder { color: #94a3b8; }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navLeft}>
            <button style={S.menuBtn} onClick={() => setShowSidebar(v => !v)}>☰</button>
            <button style={S.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
            <span style={S.courseTitle}>📚 {courseName || 'Loading...'}</span>
          </div>
          <div style={S.navRight}>
            <div style={S.hintToggle}>
              <span style={S.hintLabel}>Hint Mode</span>
              <button style={S.toggleTrack(hintMode)} onClick={() => setHintMode(v => !v)}>
                <span style={S.toggleThumb(hintMode)} />
              </button>
              {hintMode && <span style={S.hintBadge}>ON</span>}
            </div>
            <span style={S.userName}>{user?.name}</span>
            <button onClick={logout} style={S.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={S.body}>
        {/* ── Sidebar ──────────────────────────────────────── */}
        {showSidebar && (
          <div style={S.sidebar}>
            <div style={S.sidebarHeader}>
              <button style={S.newChatBtn} onClick={startNewChat}>+ New Chat</button>
            </div>
            <div style={S.sidebarList}>
              <span style={S.sidebarLabel}>Recent Chats</span>
              {sessions.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: C.textMuted, textAlign: 'center', padding: '1rem 0.5rem', margin: 0 }}>
                  No chats yet
                </p>
              ) : sessions.map((session) => (
                <button
                  key={session.id}
                  className="session-btn"
                  onClick={() => loadSession(session)}
                  style={S.sessionBtn(currentSessionId === session.id)}
                >
                  <span style={S.sessionName}>
                    {session.messages?.[0]?.content || 'New chat'}
                  </span>
                  <span style={S.sessionDate}>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Main chat ────────────────────────────────────── */}
        <main style={S.main}>
          <div style={S.messagesWrap}>

            {/* Session switching loader */}
            {sessionLoading && (
              <div style={S.emptyState}>
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  <div style={S.dot('0ms')} />
                  <div style={S.dot('150ms')} />
                  <div style={S.dot('300ms')} />
                </div>
                <p style={{ fontSize: '0.875rem', color: C.textMuted, marginTop: '0.75rem' }}>Loading chat history...</p>
              </div>
            )}

            {/* Empty state */}
            {!sessionLoading && messages.length === 0 && (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>💬</div>
                <h3 style={S.emptyTitle}>Ask anything about {courseName}</h3>
                <p style={S.emptyHint}>
                  {hintMode
                    ? '💡 Hint mode ON — I will guide without giving direct answers'
                    : 'I will answer using your course materials'}
                </p>
                <div style={S.suggestions}>
                  {['Explain the main concepts', 'Give me an example', 'What should I study first?'].map(s => (
                    <button key={s} className="suggestion" onClick={() => setInput(s)} style={S.suggestion}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {!sessionLoading && messages.map((msg, i) => (
              <div key={i} style={S.msgRow(msg.role === 'user')}>
                <div style={{ maxWidth: '72%' }}>
                  <div style={S.msgBubble(msg.role === 'user')}>
                    {msg.role === 'assistant' && (
                      <div style={S.msgHeader}>
                        <span style={S.msgLabel}>{hintMode ? '💡 Hint Mode' : '🤖 AI Tutor'}</span>
                      </div>
                    )}
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                  </div>

                  {msg.role === 'assistant' && msg.sources?.length > 0 && (
                    <div style={S.sources}>
                      <p style={{ ...S.sourcesLabel, margin: '0 0 0.3rem' }}>📚 Sources Used</p>
                      {msg.sources.map((src, j) => (
                        <p key={j} style={{ ...S.sourceItem, margin: '0.1rem 0' }}>• {src}</p>
                      ))}
                    </div>
                  )}

                  <p style={S.timestamp(msg.role === 'user')}>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading */}
            {!sessionLoading && loading && (
              <div style={S.msgRow(false)}>
                <div style={S.loadingBubble}>
                  <span style={S.loadingText}>AI Tutor is thinking</span>
                  <div style={S.dot('0ms')} />
                  <div style={S.dot('150ms')} />
                  <div style={S.dot('300ms')} />
                </div>
              </div>
            )}

            {!sessionLoading && error && <div style={S.errorBanner}>⚠️ {error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ──────────────────────────────────────── */}
          <div style={S.inputArea}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hintMode ? '💡 Ask for a hint...' : '💬 Ask a question about your course...'}
              rows={3}
              disabled={loading}
              style={{ ...S.textarea, opacity: loading ? 0.5 : 1 }}
            />
            <div style={S.inputFooter}>
              <span style={S.inputHint}>Enter to send · Shift+Enter for new line</span>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  ...S.sendBtn,
                  opacity: (loading || !input.trim()) ? 0.38 : 1,
                  cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Sending...' : 'Send →'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}