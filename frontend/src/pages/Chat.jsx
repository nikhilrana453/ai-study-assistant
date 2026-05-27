import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Chat() {
  const { courseId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintMode, setHintMode] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const coursesRes = await api.get('/courses/my-courses');
        const course = coursesRes.data.find(c => c.id === courseId);
        if (course) setCourseName(course.name);

        const historyRes = await api.get(`/chat/history?courseId=${courseId}`);
        if (historyRes.data.messages.length > 0) {
          setMessages(historyRes.data.messages);
          setCurrentSessionId(historyRes.data.sessionId);
        }

        const sessionsRes = await api.get(`/chat/sessions?courseId=${courseId}`);
        setSessions(sessionsRes.data);
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
        hintMode
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources || []
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentSessionId(res.data.sessionId);

      // Refresh sessions list
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-400 hover:text-gray-600 text-sm p-1"
            >
              ☰
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ← Back
            </button>
            <span className="font-bold text-gray-800">
              📚 {courseName || 'Loading...'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Hint Mode</span>
              <button
                onClick={() => setHintMode(!hintMode)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  hintMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    hintMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              {hintMode && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  ON
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:underline">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full">

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 bg-white border-r flex flex-col shrink-0">
            <div className="p-4 border-b">
              <button
                onClick={startNewChat}
                className="w-full bg-blue-600 text-white text-sm py-2 rounded-xl hover:bg-blue-700 transition-colors"
              >
                + New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <p className="text-xs text-gray-400 px-2 py-1 font-medium">
                Recent Chats
              </p>
              {sessions.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-4 text-center">
                  No chats yet
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setMessages(session.messages || []);
                      setCurrentSessionId(session.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <p className="truncate font-medium">
                      {session.messages?.[0]?.content || 'New chat'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <main className="flex-1 px-6 py-6 flex flex-col">

          <div className="flex-1 space-y-4 mb-4 min-h-96">

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-gray-600 font-medium text-lg">
                  Ask anything about {courseName}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {hintMode
                    ? '💡 Hint mode ON — I will guide without giving direct answers'
                    : 'I will answer using your course materials'}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {[
                    'Explain the main concepts',
                    'Give me an example',
                    'What should I study first?'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-sm bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`max-w-[75%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-400">
                          {hintMode ? '💡 Hint Mode' : '🤖 AI Tutor'}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Sources Panel */}
                  {msg.role === 'assistant' &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-medium text-blue-600 mb-1">
                        📚 Sources Used:
                      </p>
                      {msg.sources.map((source, j) => (
                        <p key={j} className="text-xs text-blue-500">
                          • {source}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-xs text-gray-300 mt-1 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : ''}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-gray-400 mr-2">
                      AI Tutor is thinking
                    </span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                ⚠️ {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hintMode
                  ? '💡 Ask for a hint...'
                  : '💬 Ask a question about your course...'
              }
              rows={3}
              disabled={loading}
              className="w-full resize-none text-sm focus:outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-400">
                Press Enter to send • Shift+Enter for new line
              </span>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
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