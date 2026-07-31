import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf8 50%, #f0f4ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
    top: '-150px',
    left: '-100px',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
    bottom: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(99,115,145,0.14)',
    boxShadow: '0 4px 24px rgba(30,41,59,0.08)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem',
    position: 'relative',
    zIndex: 1,
  },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logoWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    borderRadius: '14px',
    marginBottom: '1.25rem',
    fontSize: '26px',
  },
  title: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 0.35rem',
    letterSpacing: '-0.02em',
  },
  subtitle: { fontSize: '0.875rem', color: '#64748b', margin: 0 },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.8125rem',
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '0.4rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#f8f9fc',
    border: '1px solid rgba(99,115,145,0.18)',
    borderRadius: '10px',
    fontSize: '0.9375rem',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  fieldWrap: { marginBottom: '1.125rem' },
  btn: {
    width: '100%',
    padding: '0.8125rem',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.9375rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    letterSpacing: '0.01em',
    transition: 'opacity 0.2s',
  },
  divider: { height: '1px', background: 'rgba(99,115,145,0.12)', margin: '1.5rem 0' },
  footer: { textAlign: 'center', fontSize: '0.875rem', color: '#475569', marginTop: 0 },
  link: { color: '#d97706', textDecoration: 'none', fontWeight: '600' },
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Full Name', name: 'name', type: 'text', placeholder: 'John Smith' },
    { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com' },
    { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoWrap}>📚</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Register as a student</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name} style={styles.fieldWrap}>
              <label style={styles.label}>{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                required
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                onFocus={() => setFocusedField(field.name)}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...styles.input,
                  borderColor: focusedField === field.name
                    ? 'rgba(245,158,11,0.6)'
                    : 'rgba(148,163,184,0.2)',
                  boxShadow: focusedField === field.name
                    ? '0 0 0 3px rgba(245,158,11,0.08)'
                    : 'none',
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div style={styles.divider} />

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}