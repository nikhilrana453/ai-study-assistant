import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import api from "../api/axios";

export default function Chat() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hintMode, setHintMode] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Load course name and chat history on mount
  useEffect(() => {
    api.get("/chat/course-id-helper")
      .then(res => {
        const c = res.data.find(c => c.id === courseId);
        if (c) setCourseName(c.name);
      });

    api.get(`/chat/history?courseId=${courseId}`)
      .then(res => {
        if (res.data.messages?.length > 0) {
          setMessages(res.data.messages);
          setSessionId(res.data.sessionId);
        }
      });

    api.get(`/chat/sessions?courseId=${courseId}`)
      .then(res => setSessions(res.data));
  }, [courseId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await api.post("/chat/message", { question, courseId, hintMode });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources
      }]);
      if (!sessionId) {
        setSessionId(res.data.sessionId);
        api.get(`/chat/sessions?courseId=${courseId}`)
          .then(r => setSessions(r.data));
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please check Ollama is running and try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const loadSession = async (sid) => {
    try {
      const res = await api.get(`/chat/history?courseId=${courseId}&sessionId=${sid}`);
      setMessages(res.data.messages || []);
      setSessionId(sid);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
  };

  const suggestions = [
    "What are the key topics in this week's lecture?",
    "Explain the main concepts covered",
    "What should I focus on for the assessment?",
    "Summarise what I should know"
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shrink-0 z-20">
        <div className="h-14 flex items-center justify-between px-4">

          {/* Left: menu + back + course name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">{courseName || courseId}</span>
            </div>
          </div>

          {/* Right: hint mode + user */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600 hidden sm:block">Hint mode</span>
              <button
                onClick={() => setHintMode(!hintMode)}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${hintMode ? "bg-indigo-600" : "bg-gray-200"}`}
                style={{ height: "22px" }}
                role="switch"
                aria-checked={hintMode}
              >
                <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${hintMode ? "translate-x-4" : "translate-x-0"}`}
                  style={{ width: "18px", height: "18px" }}
                />
              </button>
            </label>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-indigo-700">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
            </div>

            <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR — fixed height, scrollable */}
        <aside className={`${sidebarOpen ? "w-64" : "w-0"} shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-200`}>
          <div className="p-3">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </button>
          </div>

          <div className="px-3 py-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Recent chats</p>
          </div>

          {/* Session list — scrollable */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-4 text-center">No chats yet</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors group ${
                    s.id === sessionId
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <p className="truncate font-medium text-gray-800">
                    {s.messages?.[0]?.content?.substring(0, 30) || "Chat session"}...
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Messages — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

              {messages.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Ask your AI tutor</h2>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    I answer exclusively from your uploaded lecture notes. Ask me anything from your course.
                  </p>

                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(s)}
                        className="text-sm bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}

                  <div className={`max-w-[78%] ${msg.role === "user" ? "order-1" : ""}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Sources panel */}
                    {msg.role === "assistant" && msg.sources?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                        </svg>
                        <span className="text-xs text-gray-400">
                          {msg.sources.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Hint mode badge */}
          {hintMode && (
            <div className="flex justify-center pb-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Hint mode on — I'll guide you, not give direct answers
              </span>
            </div>
          )}

          {/* Input area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your course..."
                  className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed"
                  rows={1}
                  style={{ minHeight: "24px", maxHeight: "120px" }}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 rounded-xl flex items-center justify-center transition-colors shrink-0"
                >
                  <svg className="w-4 h-4 text-white disabled:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}