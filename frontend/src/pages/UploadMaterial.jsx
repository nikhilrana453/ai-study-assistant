import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function UploadMaterial() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    courseId: '',
    title: '',
    topic: '',
    week: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    api.get('/admin/courses').then(r => setCourses(r.data));
  }, []);

  useEffect(() => {
    if (form.courseId) {
      api.get(`/materials?courseId=${form.courseId}`)
        .then(r => setMaterials(r.data))
        .catch(() => setMaterials([]));
    }
  }, [form.courseId]);

  const handleUpload = async () => {
    if (!file || !form.courseId || !form.title) {
      setError('Please fill in all required fields and select a file');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', form.courseId);
    formData.append('title', form.title);
    formData.append('topic', form.topic);
    formData.append('week', form.week);

    try {
      await api.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ File uploaded successfully!');
      setFile(null);
      setForm({ ...form, title: '', topic: '', week: '' });

      // Refresh materials list
      const r = await api.get(`/materials?courseId=${form.courseId}`);
      setMaterials(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    return '📁';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ← Back to Admin
            </button>
            <span className="font-bold text-gray-800">📤 Upload Materials</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Form */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Upload New Material</h2>

          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course *
              </label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                placeholder="e.g. Week 3 - OOP Lecture Notes"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <input
                placeholder="e.g. Object Oriented Programming"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Week Number
              </label>
              <input
                type="number"
                placeholder="e.g. 3"
                value={form.week}
                onChange={(e) => setForm({ ...form, week: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File * (PDF, DOCX, TXT — max 50MB)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <p className="text-2xl mb-2">📄</p>
                  <p className="text-sm font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl mb-2">📤</p>
                  <p className="text-sm text-gray-500">
                    Click to select a file
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOCX, TXT supported
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload Material'}
          </button>
        </section>

        {/* Materials List */}
        {form.courseId && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              Uploaded Materials ({materials.length})
            </h2>
            {materials.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                No materials uploaded yet for this course
              </p>
            ) : (
              <div className="space-y-3">
                {materials.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <span className="text-2xl">{getFileIcon(m.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{m.title}</p>
                      <div className="flex gap-2 mt-0.5">
                        {m.topic && (
                          <span className="text-xs text-gray-500">{m.topic}</span>
                        )}
                        {m.week && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 rounded-full">
                            Week {m.week}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}