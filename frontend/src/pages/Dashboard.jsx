import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const S = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    color: '#f1f5f9',
  },
  nav: {
    background: '#ffffff',
    borderBottom: '1px solid rgba(99,115,145,0.12)',
    boxShadow: '0 1px 3px rgba(30,41,59,0.06)',
    padding: '1rem 1.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  navLogo: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  navTitle: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontWeight: '700',
    fontSize: '1.125rem',
    color: '#1e293b',
    letterSpacing: '-0.01em',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  navGreeting: { fontSize: '0.875rem', color: '#475569' },
  navName: { color: '#1e293b', fontWeight: '600' },
  logoutBtn: {
    background: 'rgba(239,68,68,0.07)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#dc2626',
    padding: '0.4rem 0.875rem',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '3rem 1.5rem',
  },
  pageHeader: { marginBottom: '2.5rem' },
  pageTitle: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 0.5rem',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: { fontSize: '0.9375rem', color: '#64748b', margin: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(99,115,145,0.12)',
    borderRadius: '16px',
    padding: '1.625rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.15s, background 0.2s',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHoverStyle: {
    borderColor: 'rgba(217,119,6,0.35)',
    background: '#ffffff',
    boxShadow: '0 4px 16px rgba(30,41,59,0.08)',
    transform: 'translateY(-2px)',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    background: 'rgba(217,119,6,0.07)',
    border: '1px solid rgba(217,119,6,0.15)',
  },
  subjectBadge: {
    background: 'rgba(99,115,145,0.07)',
    border: '1px solid rgba(99,115,145,0.14)',
    color: '#64748b',
    fontSize: '0.75rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    fontWeight: '500',
    letterSpacing: '0.02em',
  },
  courseName: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 0.375rem',
    lineHeight: '1.3',
  },
  courseDesc: {
    fontSize: '0.875rem',
    color: '#475569',
    margin: '0 0 1.25rem',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#d97706',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  skeleton: {
    background: '#e8edf5',
    border: '1px solid rgba(99,115,145,0.08)',
    borderRadius: '16px',
    height: '200px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  emptyState: {
    background: '#ffffff',
    border: '1px solid rgba(99,115,145,0.10)',
    borderRadius: '16px',
    padding: '4rem',
    textAlign: 'center',
    gridColumn: '1 / -1',
  },
  emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
  emptyTitle: { fontSize: '1.125rem', fontWeight: '600', color: '#475569', margin: '0 0 0.5rem' },
  emptyDesc: { fontSize: '0.875rem', color: '#94a3b8', margin: 0 },
};

const icons = ['📘', '📗', '📙', '📕', '📓', '📒'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses/my-courses')
      .then((res) => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navBrand}>
            <div style={S.navLogo}>📚</div>
            <span style={S.navTitle}>Study Assistant</span>
          </div>
          <div style={S.navRight}>
            <span style={S.navGreeting}>
              Welcome back, <span style={S.navName}>{user?.name}</span>
            </span>
            <button onClick={logout} style={S.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>

      <main style={S.main}>
        <div style={S.pageHeader}>
          <h2 style={S.pageTitle}>Your Courses</h2>
          <p style={S.pageSubtitle}>Select a course to start studying with AI assistance</p>
        </div>

        <div style={S.grid}>
          {loading ? (
            [1, 2, 3, 4].map((i) => <div key={i} style={S.skeleton} />)
          ) : courses.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>🎓</div>
              <p style={S.emptyTitle}>No courses yet</p>
              <p style={S.emptyDesc}>Contact your educator to get enrolled in a course</p>
            </div>
          ) : (
            courses.map((course, i) => {
              const isHovered = hoveredId === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => navigate(`/chat/${course.id}`)}
                  onMouseEnter={() => setHoveredId(course.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ ...S.card, ...(isHovered ? S.cardHoverStyle : {}) }}
                >
                  <div style={{ ...S.cardAccent, opacity: isHovered ? 1 : 0 }} />
                  <div style={S.cardTop}>
                    <div style={S.iconWrap}>{icons[i % icons.length]}</div>
                    <span style={S.subjectBadge}>{course.subject}</span>
                  </div>
                  <h3 style={S.courseName}>{course.name}</h3>
                  <p style={S.courseDesc}>{course.description}</p>
                  <div style={S.cardFooter}>
                    <span>Open Chat</span>
                    <span style={{ transition: 'transform 0.2s', transform: isHovered ? 'translateX(3px)' : 'none' }}>→</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}