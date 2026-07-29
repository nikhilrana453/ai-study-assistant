import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function UploadMaterial() {
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ title: "", courseId: "", topic: "", week: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    api.get("/admin/courses").then(r => setCourses(r.data));
  }, []);

  useEffect(() => {
    if (form.courseId) {
      api.get(`/materials?courseId=${form.courseId}`)
        .then(r => setMaterials(r.data))
        .catch(() => setMaterials([]));
    }
  }, [form.courseId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
    data.append("file", file);
    Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
    try {
      await api.post("/materials/upload", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showToast("Material uploaded and processed successfully");
      setFile(null);
      setForm(f => ({ ...f, title: "", topic: "", week: "" }));
      const res = await api.get(`/materials?courseId=${form.courseId}`);
      setMaterials(res.data);
    } catch {
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const fileTypeIcon = (type) => {
    if (type?.includes("pdf")) return { label: "PDF", color: "bg-red-50 text-red-600" };
    if (type?.includes("word") || type?.includes("docx")) return { label: "DOC", color: "bg-blue-50 text-blue-600" };
    return { label: "TXT", color: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-green-50 border border-green-200 text-green-700"
        }`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            {toast.type === "error"
              ? <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            }
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Admin
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <span className="font-semibold text-gray-900 text-sm">Upload materials</span>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upload form */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload lecture material</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : file
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={e => setFile(e.target.files[0])}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className={`text-xs font-medium px-2 py-1 rounded-md ${fileTypeIcon(file.type).color}`}>
                      {fileTypeIcon(file.type).label}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="ml-auto text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Drop a file or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT — up to 50 MB</p>
                  </>
                )}
              </div>

              {/* Form fields */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Title <span className="text-red-400">*</span></label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Week 2 Lecture Notes"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Course <span className="text-red-400">*</span></label>
                  <select
                    value={form.courseId}
                    onChange={e => setForm({ ...form, courseId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Topic</label>
                    <input
                      value={form.topic}
                      onChange={e => setForm({ ...form, topic: e.target.value })}
                      placeholder="e.g. UI Design"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Week</label>
                    <input
                      type="number"
                      value={form.week}
                      onChange={e => setForm({ ...form, week: e.target.value })}
                      placeholder="2"
                      min="1"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file || !form.courseId || !form.title}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload and process
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Materials list */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Uploaded materials
              {form.courseId && <span className="text-sm font-normal text-gray-400 ml-2">{materials.length} files</span>}
            </h2>

            {!form.courseId ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">Select a course to see its materials</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">No materials uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {materials.map(mat => {
                  const ft = fileTypeIcon(mat.type);
                  return (
                    <div key={mat.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md shrink-0 ${ft.color}`}>
                        {ft.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{mat.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {mat.topic && `${mat.topic} · `}
                          {mat.week && `Week ${mat.week} · `}
                          {new Date(mat.createdAt).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" title="Processed" />
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