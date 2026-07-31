import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const S = {
  page: { minHeight: '100vh', background: '#f5f6fa', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#f1f5f9' },
  nav: {
    background: '#ffffff',
    borderBottom: '1px solid rgba(99,115,145,0.12)',
    boxShadow: '0 1px 3px rgba(30,41,59,0.06)',
    padding: '1rem 1.5rem',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navInner: { maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '0.875rem' },
  backBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '0.8125rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '6px' },
  navTitle: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: '700', fontSize: '1.0625rem', color: '#f1f5f9', letterSpacing: '-0.01em' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  card: { background: '#ffffff', border: '1px solid rgba(99,115,145,0.12)', boxShadow: '0 1px 4px rgba(30,41,59,0.05)', borderRadius: '16px', padding: '1.75rem' },
  cardTitle: { fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.25rem', letterSpacing: '-0.01em' },
  successBanner: { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', color: '#059669', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '1.25rem' },
  errorBanner: { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '1.25rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' },
  required: { color: '#d97706', marginLeft: '2px' },
  input: { width: '100%', padding: '0.6875rem 0.875rem', background: '#f8f9fc', border: '1px solid rgba(99,115,145,0.16)', borderRadius: '10px', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' },
  select: { width: '100%', padding: '0.6875rem 0.875rem', background: '#f8f9fc', border: '1px solid rgba(99,115,145,0.16)', borderRadius: '10px', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box', appearance: 'none' },
  dropzone: (hasFile) => ({
    marginTop: '1rem',
    border: `2px dashed ${hasFile ? 'rgba(217,119,6,0.45)' : 'rgba(99,115,145,0.22)'}`,
    borderRadius: '12px',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    background: hasFile ? 'rgba(217,119,6,0.04)' : '#f8f9fc',
    transition: 'all 0.2s',
  }),
  dropIcon: { fontSize: '2.5rem', marginBottom: '0.75rem' },
  dropTitle: { fontSize: '0.9375rem', color: '#475569', fontWeight: '500', marginBottom: '0.375rem' },
  dropSub: { fontSize: '0.8125rem', color: '#94a3b8' },
  fileName: { fontSize: '0.9375rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' },
  fileSize: { fontSize: '0.8125rem', color: '#475569' },
  uploadBtn: { marginTop: '1.25rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#ffffff', fontWeight: '700', fontSize: '0.9375rem', padding: '0.6875rem 1.75rem', borderRadius: '10px', cursor: 'pointer', letterSpacing: '0.01em', transition: 'opacity 0.2s' },
  materialItem: { display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', background: '#f8f9fc', borderRadius: '12px', border: '1px solid rgba(99,115,145,0.10)' },
  materialIcon: { fontSize: '1.75rem', flexShrink: 0 },
  materialMeta: { flex: 1, minWidth: 0 },
  materialName: { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' },
  materialTags: { display: 'flex', gap: '0.375rem', alignItems: 'center' },
  tagTopic: { fontSize: '0.75rem', color: '#475569' },
  tagWeek: { fontSize: '0.6875rem', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.22)', color: '#b45309', padding: '0.15rem 0.5rem', borderRadius: '20px', fontWeight: '600' },
  materialDate: { fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 },
  emptyMaterials: { textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' },
  materialsHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 1rem' },
  count: { fontSize: '0.8125rem', color: '#475569' },
  listWrap: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
};

const getFileIcon = (type = '') => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word')) return '📝';
  return '📁';
};

export default function UploadMaterial() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ courseId: '', title: '', topic: '', week: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState([]);

  useEffect(() => { api.get('/admin/courses').then(r => setCourses(r.data)); }, []);
  useEffect(() => {
    if (form.courseId) {
      api.get(`/materials?courseId=${form.courseId}`).then(r => setMaterials(r.data)).catch(() => setMaterials([]));
    }
  }, [form.courseId]);

  const handleUpload = async () => {
    if (!file || !form.courseId || !form.title) { setError('Please fill in all required fields and select a file'); return; }
    setLoading(true); setError(''); setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    try {
      await api.post('/materials/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('File uploaded and processed successfully!');
      setFile(null);
      setForm(f => ({ ...f, title: '', topic: '', week: '' }));
      const r = await api.get(`/materials?courseId=${form.courseId}`);
      setMaterials(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = { borderColor: 'rgba(217,119,6,0.5)', boxShadow: '0 0 0 3px rgba(217,119,6,0.08)' };

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navLeft}>
            <button onClick={() => navigate('/admin')} style={S.backBtn}>← Back to Admin</button>
            <span style={S.navTitle}>↑ Upload Materials</span>
          </div>
        </div>
      </nav>

      <main style={S.main}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Upload New Material</h2>
          {message && <div style={S.successBanner}>✓ {message}</div>}
          {error && <div style={S.errorBanner}>⚠ {error}</div>}

          <div style={S.formGrid}>
            <div style={S.fieldWrap}>
              <label style={S.label}>Course<span style={S.required}>*</span></label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                style={S.select}
              >
                <option value="">Select course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Title<span style={S.required}>*</span></label>
              <input
                placeholder="e.g. Week 3 – OOP Lecture Notes"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.15)'; e.target.style.boxShadow = 'none'; }}
                style={S.input}
              />
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Topic</label>
              <input
                placeholder="e.g. Object Oriented Programming"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.15)'; e.target.style.boxShadow = 'none'; }}
                style={S.input}
              />
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Week Number</label>
              <input
                type="number"
                placeholder="e.g. 3"
                value={form.week}
                onChange={(e) => setForm({ ...form, week: e.target.value })}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.15)'; e.target.style.boxShadow = 'none'; }}
                style={S.input}
              />
            </div>
          </div>

          {/* Drop Zone */}
          <div
            style={S.dropzone(!!file)}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input id="fileInput" type="file" style={{ display: 'none' }} accept=".pdf,.docx,.doc,.txt" onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <>
                <div style={S.dropIcon}>📄</div>
                <p style={S.fileName}>{file.name}</p>
                <p style={S.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
              </>
            ) : (
              <>
                <div style={S.dropIcon}>📤</div>
                <p style={S.dropTitle}>Click to select a file</p>
                <p style={S.dropSub}>PDF, DOCX, TXT supported · Max 50 MB</p>
              </>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            style={{ ...S.uploadBtn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Uploading...' : 'Upload Material →'}
          </button>
        </div>

        {/* Materials List */}
        {form.courseId && (
          <div style={S.card}>
            <div style={S.materialsHeader}>
              <h2 style={{ ...S.cardTitle, margin: 0 }}>Uploaded Materials</h2>
              <span style={S.count}>{materials.length} file{materials.length !== 1 ? 's' : ''}</span>
            </div>
            {materials.length === 0 ? (
              <div style={S.emptyMaterials}>No materials uploaded yet for this course</div>
            ) : (
              <div style={S.listWrap}>
                {materials.map(m => (
                  <div key={m.id} style={S.materialItem}>
                    <span style={S.materialIcon}>{getFileIcon(m.type)}</span>
                    <div style={S.materialMeta}>
                      <p style={S.materialName}>{m.title}</p>
                      <div style={S.materialTags}>
                        {m.topic && <span style={S.tagTopic}>{m.topic}</span>}
                        {m.week && <span style={S.tagWeek}>Week {m.week}</span>}
                      </div>
                    </div>
                    <span style={S.materialDate}>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}