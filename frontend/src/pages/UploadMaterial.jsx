import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function UploadMaterial() {
  const [courses, setCourses]     = useState([]);
  const [materials, setMaterials] = useState([]);
  const [form, setForm]           = useState({ title:'', courseId:'', topic:'', week:'' });
  const [file, setFile]           = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [toast, setToast]         = useState(null);
  const fileRef  = useRef();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    api.get('/admin/courses').then(r => setCourses(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.courseId) {
      api.get(`/materials?courseId=${form.courseId}`)
        .then(r => setMaterials(r.data))
        .catch(() => setMaterials([]));
    }
  }, [form.courseId]);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !form.courseId || !form.title) return;
    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    Object.entries(form).forEach(([k,v]) => v && data.append(k, v));
    try {
      await api.post('/materials/upload', data, { headers:{ 'Content-Type':'multipart/form-data' } });
      showToast('Material uploaded and processed successfully! ✅');
      setFile(null);
      setForm(f => ({ ...f, title:'', topic:'', week:'' }));
      const res = await api.get(`/materials?courseId=${form.courseId}`);
      setMaterials(res.data);
    } catch {
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const fileTypeInfo = (type) => {
    if (type?.includes('pdf'))  return { label:'PDF', bg:'#fef2f2', color:'#dc2626' };
    if (type?.includes('word')) return { label:'DOC', bg:'#eff6ff', color:'#3b82f6' };
    return { label:'TXT', bg:'#f1f5f9', color:'#64748b' };
  };

  const inputStyle = { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', color:'#0f172a' };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif' }}>

      {toast && (
        <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:999, background: toast.type==='error' ? '#fef2f2' : '#f0fdf4', border:`1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`, color: toast.type==='error' ? '#dc2626' : '#16a34a', padding:'0.75rem 1.25rem', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'500', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => navigate('/admin')} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.35rem' }}>← Admin</button>
            <span style={{ color:'#d1d5db' }}>|</span>
            <span style={{ fontWeight:'700', fontSize:'0.95rem', color:'#0f172a' }}>Upload Materials</span>
          </div>
          <button onClick={logout} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.4rem 0.9rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'500' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>

          {/* Upload Form */}
          <div>
            <h2 style={{ fontWeight:'700', color:'#0f172a', margin:'0 0 1.5rem', fontSize:'1.1rem' }}>Upload Lecture Material</h2>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* Drop Zone */}
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? '#6366f1' : file ? '#10b981' : '#d1d5db'}`,
                  borderRadius:'16px', padding:'2rem', textAlign:'center', cursor:'pointer',
                  background: dragOver ? '#eff6ff' : file ? '#ecfdf5' : '#fff',
                  transition:'all 0.2s',
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" onChange={e => setFile(e.target.files[0])} style={{ display:'none' }} />
                {file ? (
                  <div>
                    <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>✅</div>
                    <p style={{ fontWeight:'600', color:'#059669', margin:'0 0 0.25rem', fontSize:'0.9rem' }}>{file.name}</p>
                    <p style={{ color:'#64748b', margin:'0 0 0.75rem', fontSize:'0.8rem' }}>{(file.size/1024/1024).toFixed(2)} MB</p>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'0.3rem 0.75rem', borderRadius:'8px', fontSize:'0.8rem', cursor:'pointer' }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📁</div>
                    <p style={{ fontWeight:'600', color:'#374151', margin:'0 0 0.35rem', fontSize:'0.9rem' }}>Drop a file or click to browse</p>
                    <p style={{ color:'#9ca3af', margin:0, fontSize:'0.8rem' }}>PDF, DOCX, TXT — up to 50 MB</p>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Title <span style={{ color:'#ef4444' }}>*</span></label>
                  <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Week 2 Lecture Notes" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Course <span style={{ color:'#ef4444' }}>*</span></label>
                  <select value={form.courseId} onChange={e => setForm({...form,courseId:e.target.value})} required style={{ ...inputStyle, background:'#fff' }}>
                    <option value="">Select course...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Topic</label>
                    <input value={form.topic} onChange={e => setForm({...form,topic:e.target.value})} placeholder="e.g. UI Design" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'500', color:'#374151', marginBottom:'0.4rem' }}>Week</label>
                    <input type="number" value={form.week} onChange={e => setForm({...form,week:e.target.value})} placeholder="2" min="1" style={inputStyle} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file || !form.courseId || !form.title}
                style={{
                  padding:'0.875rem', fontSize:'0.95rem', fontWeight:'600', border:'none', borderRadius:'12px', cursor: (uploading || !file || !form.courseId || !form.title) ? 'not-allowed' : 'pointer',
                  background: (uploading || !file || !form.courseId || !form.title) ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: (uploading || !file || !form.courseId || !form.title) ? '#9ca3af' : '#fff',
                  transition:'all 0.2s',
                }}
              >
                {uploading ? '⏳ Processing...' : '↑ Upload and Process'}
              </button>
            </form>
          </div>

          {/* Materials List */}
          <div>
            <h2 style={{ fontWeight:'700', color:'#0f172a', margin:'0 0 1.5rem', fontSize:'1.1rem' }}>
              Uploaded Materials
              {form.courseId && <span style={{ color:'#64748b', fontWeight:'400', fontSize:'0.9rem', marginLeft:'0.5rem' }}>({materials.length} files)</span>}
            </h2>

            {!form.courseId ? (
              <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'3rem', textAlign:'center' }}>
                <p style={{ color:'#9ca3af', margin:0, fontSize:'0.875rem' }}>Select a course to see its materials</p>
              </div>
            ) : materials.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', padding:'3rem', textAlign:'center' }}>
                <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>📭</div>
                <p style={{ color:'#9ca3af', margin:0, fontSize:'0.875rem' }}>No materials uploaded yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {materials.map(mat => {
                  const ft = fileTypeInfo(mat.type);
                  return (
                    <div key={mat.id} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0', padding:'0.875rem 1rem', display:'flex', alignItems:'center', gap:'0.875rem' }}>
                      <span style={{ background: ft.bg, color: ft.color, fontSize:'0.7rem', fontWeight:'700', padding:'0.25rem 0.6rem', borderRadius:'6px', flexShrink:0 }}>{ft.label}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:'600', color:'#0f172a', margin:'0 0 0.15rem', fontSize:'0.875rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mat.title}</p>
                        <p style={{ color:'#9ca3af', margin:0, fontSize:'0.75rem' }}>
                          {mat.topic && `${mat.topic} · `}
                          {mat.week && `Week ${mat.week} · `}
                          {new Date(mat.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ width:'8px', height:'8px', background:'#10b981', borderRadius:'50%', flexShrink:0 }} title="Processed" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}