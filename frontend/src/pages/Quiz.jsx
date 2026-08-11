import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Quiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [topic, setTopic]         = useState('');
  const [quiz, setQuiz]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [score, setScore]         = useState(0);

  const generateQuiz = async () => {
    setLoading(true);
    setError('');
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await api.post('/quiz/generate', { courseId, topic });
      setQuiz(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    window.scrollTo(0, 0);
  };

  const getOptionStyle = (qi, option) => {
    const letter = option.charAt(0);
    if (!submitted) {
      return {
        background: answers[qi] === letter ? '#eff6ff' : '#fff',
        border: `1.5px solid ${answers[qi] === letter ? '#6366f1' : '#e2e8f0'}`,
        color: answers[qi] === letter ? '#4338ca' : '#374151',
      };
    }
    const correct = quiz.questions[qi].answer;
    if (letter === correct) return { background:'#f0fdf4', border:'1.5px solid #86efac', color:'#15803d' };
    if (letter === answers[qi]) return { background:'#fef2f2', border:'1.5px solid #fca5a5', color:'#dc2626' };
    return { background:'#fff', border:'1.5px solid #e2e8f0', color:'#9ca3af' };
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate(`/chat/${courseId}`)} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer' }}>← Back to Chat</button>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>🧠 Quiz Generator</span>
          </div>
          <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Score Card */}
        {submitted && (
          <div style={{ background: score >= 4 ? '#f0fdf4' : score >= 2 ? '#fefce8' : '#fef2f2', border:`1px solid ${score >= 4 ? '#86efac' : score >= 2 ? '#fde68a' : '#fca5a5'}`, borderRadius:'16px', padding:'1.5rem', marginBottom:'1.5rem', textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>{score >= 4 ? '🎉' : score >= 2 ? '👍' : '📚'}</div>
            <h2 style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.35rem' }}>
              You scored {score} / {quiz.questions.length}
            </h2>
            <p style={{ color:'#64748b', margin:0, fontSize:'0.9rem' }}>
              {score >= 4 ? 'Excellent work! You know this material well.' : score >= 2 ? 'Good effort! Review the incorrect answers below.' : 'Keep studying! Review your lecture notes and try again.'}
            </p>
            <button onClick={generateQuiz} style={{ marginTop:'1rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', padding:'0.6rem 1.5rem', borderRadius:'10px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer' }}>
              Try Another Quiz →
            </button>
          </div>
        )}

        {/* Generate Form */}
        {!quiz && !loading && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'2rem', marginBottom:'1.5rem' }}>
            <h1 style={{ fontSize:'1.4rem', fontWeight:'700', color:'#0f172a', margin:'0 0 0.5rem' }}>🧠 Quiz Generator</h1>
            <p style={{ color:'#64748b', margin:'0 0 1.5rem', fontSize:'0.9rem' }}>Generate 5 multiple choice questions from your lecture notes.</p>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Topic (optional) e.g. UI Design, Security..."
                style={{ flex:1, padding:'0.7rem 1rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.9rem', outline:'none' }}
              />
              <button onClick={generateQuiz} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', padding:'0.7rem 1.5rem', borderRadius:'10px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' }}>
                Generate Quiz →
              </button>
            </div>
            {error && <p style={{ color:'#dc2626', fontSize:'0.85rem', margin:'0.75rem 0 0' }}>⚠️ {error}</p>}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'4rem', textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⏳</div>
            <p style={{ color:'#64748b', margin:0, fontWeight:'500' }}>Generating your quiz from lecture notes...</p>
          </div>
        )}

        {/* Questions */}
        {quiz && !loading && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#0f172a', margin:0 }}>
                {submitted ? 'Review Answers' : 'Answer All Questions'}
              </h2>
              {!submitted && (
                <button onClick={generateQuiz} style={{ background:'none', border:'1px solid #e2e8f0', color:'#64748b', padding:'0.4rem 0.875rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>
                  🔄 New Quiz
                </button>
              )}
            </div>

            {quiz.questions.map((q, qi) => (
              <div key={qi} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.5rem', marginBottom:'1rem' }}>
                <p style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 1rem', fontSize:'0.95rem', lineHeight:'1.5' }}>
                  <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', borderRadius:'6px', padding:'0.15rem 0.5rem', fontSize:'0.8rem', marginRight:'0.5rem' }}>Q{qi + 1}</span>
                  {q.question}
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {q.options.map((option, oi) => (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => !submitted && setAnswers(prev => ({ ...prev, [qi]: option.charAt(0) }))}
                      style={{
                        ...getOptionStyle(qi, option),
                        padding:'0.7rem 1rem', borderRadius:'10px', textAlign:'left',
                        fontSize:'0.875rem', cursor: submitted ? 'default' : 'pointer',
                        transition:'all 0.15s', lineHeight:'1.5',
                      }}
                    >
                      {option}
                      {submitted && option.charAt(0) === q.answer && ' ✓'}
                      {submitted && option.charAt(0) === answers[qi] && option.charAt(0) !== q.answer && ' ✗'}
                    </button>
                  ))}
                </div>
                {submitted && (
                  <div style={{ marginTop:'0.875rem', padding:'0.75rem', background:'#f8fafc', borderRadius:'10px', fontSize:'0.8rem', color:'#475569' }}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            ))}

            {!submitted && (
              <button
                onClick={submitQuiz}
                disabled={Object.keys(answers).length < quiz.questions.length}
                style={{
                  width:'100%', padding:'0.9rem', fontSize:'1rem', fontWeight:'600', border:'none', borderRadius:'12px', cursor: Object.keys(answers).length < quiz.questions.length ? 'not-allowed' : 'pointer',
                  background: Object.keys(answers).length < quiz.questions.length ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: Object.keys(answers).length < quiz.questions.length ? '#9ca3af' : '#fff',
                }}
              >
                Submit Quiz ({Object.keys(answers).length}/{quiz.questions.length} answered)
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}