import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);

  const token = localStorage.getItem('token');

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data.courses);
      setMessage('✅ Courses loaded');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Fetch course details
  const fetchCourseDetails = async (courseId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCourse(response.data.course);

      const materialsRes = await axios.get(
        `${API_URL}/api/admin/course/${courseId}/materials`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourseMaterials(materialsRes.data.materials);
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Fetch enrollments
  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnrollments(response.data.enrollments);
      setMessage('✅ Enrollments loaded');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
      setMessage('✅ Stats loaded');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Delete course
  const deleteCourse = async (courseId) => {
    if (!window.confirm('⚠️ This will delete the entire course, all materials, and enrollments. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/api/admin/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ ${response.data.message}`);
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Update course
  const updateCourse = async (courseId, courseData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/course/${courseId}`,
        courseData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${response.data.message}`);
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Delete material
  const deleteMaterial = async (materialId) => {
    if (!window.confirm('⚠️ Delete this material and all its chunks?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/api/admin/material/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ ${response.data.message}`);
      if (selectedCourse) {
        fetchCourseDetails(selectedCourse.id);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Delete enrollment
  const deleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('⚠️ Remove this student from the course?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/api/admin/enrollment/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ ${response.data.message}`);
      fetchEnrollments();
      if (selectedCourse) {
        fetchCourseDetails(selectedCourse.id);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // Load initial data
  useEffect(() => {
    if (activeTab === 'courses') fetchCourses();
    if (activeTab === 'enrollments') fetchEnrollments();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  return (
    <div className="admin-dashboard">
      <h1>🛠️ Admin Dashboard</h1>

      {message && (
        <div className="alert">
          {message}
          <button onClick={() => setMessage('')}>✕</button>
        </div>
      )}

      <div className="tabs">
        <button
          className={activeTab === 'courses' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </button>
        <button
          className={activeTab === 'enrollments' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('enrollments')}
        >
          👥 Enrollments
        </button>
        <button
          className={activeTab === 'stats' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('stats')}
        >
          📊 Stats
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {/* COURSES TAB */}
      {activeTab === 'courses' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Manage Courses</h2>
          </div>

          {!selectedCourse ? (
            <div className="courses-list">
              {courses.length === 0 ? (
                <p>No courses found</p>
              ) : (
                courses.map(course => (
                  <div key={course.id} className="course-card">
                    <div className="course-info">
                      <h3>{course.name}</h3>
                      <p className="subject">{course.subject}</p>
                      <p className="description">{course.description}</p>
                      <div className="stats-row">
                        <span>👥 {course.studentCount} students</span>
                        <span>📄 {course.materialCount} materials</span>
                        <span>📅 {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => fetchCourseDetails(course.id)}
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditingCourse(course)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteCourse(course.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="course-details">
              <button
                className="btn btn-back"
                onClick={() => {
                  setSelectedCourse(null);
                  setCourseMaterials([]);
                }}
              >
                ← Back to Courses
              </button>

              <h2>{selectedCourse.name}</h2>

              {/* Enrollments */}
              <div className="subsection">
                <h3>👥 Enrolled Students ({selectedCourse.enrollments.length})</h3>
                {selectedCourse.enrollments.length === 0 ? (
                  <p>No students enrolled</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCourse.enrollments.map(enrollment => (
                        <tr key={enrollment.id}>
                          <td>{enrollment.user.name}</td>
                          <td>{enrollment.user.email}</td>
                          <td>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => deleteEnrollment(enrollment.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Materials */}
              <div className="subsection">
                <h3>📄 Course Materials ({courseMaterials.length})</h3>
                {courseMaterials.length === 0 ? (
                  <p>No materials uploaded</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Chunks</th>
                        <th>Uploaded</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseMaterials.map(material => (
                        <tr key={material.id}>
                          <td>{material.title}</td>
                          <td className="type-badge">{material.type}</td>
                          <td>{material.chunkCount}</td>
                          <td>{new Date(material.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => deleteMaterial(material.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Edit Course Modal */}
          {editingCourse && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Edit Course</h3>
                <input
                  type="text"
                  placeholder="Course Name"
                  defaultValue={editingCourse.name}
                  id="editName"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  defaultValue={editingCourse.subject}
                  id="editSubject"
                />
                <textarea
                  placeholder="Description"
                  defaultValue={editingCourse.description}
                  id="editDesc"
                ></textarea>
                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      updateCourse(editingCourse.id, {
                        name: document.getElementById('editName').value,
                        subject: document.getElementById('editSubject').value,
                        description: document.getElementById('editDesc').value
                      });
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditingCourse(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENROLLMENTS TAB */}
      {activeTab === 'enrollments' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>All Enrollments</h2>
          </div>

          {enrollments.length === 0 ? (
            <p>No enrollments found</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Enrolled Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(enrollment => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.user.name}</td>
                    <td>{enrollment.user.email}</td>
                    <td>{enrollment.course.name}</td>
                    <td>{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => deleteEnrollment(enrollment.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Database Statistics</h2>
          </div>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">👥</span>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats.users}</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📚</span>
                <div className="stat-content">
                  <h3>Courses</h3>
                  <p className="stat-number">{stats.courses}</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📝</span>
                <div className="stat-content">
                  <h3>Enrollments</h3>
                  <p className="stat-number">{stats.enrollments}</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📄</span>
                <div className="stat-content">
                  <h3>Materials</h3>
                  <p className="stat-number">{stats.materials}</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🔍</span>
                <div className="stat-content">
                  <h3>Document Chunks</h3>
                  <p className="stat-number">{stats.chunks}</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💬</span>
                <div className="stat-content">
                  <h3>Chat Sessions</h3>
                  <p className="stat-number">{stats.chatSessions}</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💭</span>
                <div className="stat-content">
                  <h3>Messages</h3>
                  <p className="stat-number">{stats.messages}</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🔖</span>
                <div className="stat-content">
                  <h3>Bookmarks</h3>
                  <p className="stat-number">{stats.bookmarks}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}