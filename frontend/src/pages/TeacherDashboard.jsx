import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams } from '../services/api';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setTeacherName(user.name || user.firstName || 'Teacher');
        setTeacherSubject(user.subject || user.teacherSubject || null);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

    fetchExams();
    fetchReports();
  }, []);

  useEffect(() => {
    if (teacherSubject) {
      const filtered = exams.filter(exam => {
        const examSubject = exam.subject?.toLowerCase() ||
          exam.subject_type?.toLowerCase() ||
          exam.title?.toLowerCase() || '';
        return examSubject.includes(teacherSubject.toLowerCase());
      });
      setFilteredExams(filtered);
    } else {
      setFilteredExams(exams);
    }
  }, [exams, teacherSubject]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getExams();
      if (response.success && response.data) {
        setExams(response.data);
      } else {
        setError(response.message || 'Failed to fetch exams');
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError(err.message || 'Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/teacher/exams/create');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getSubjectBadge = (exam) => {
    const subject = exam.subject || exam.subject_type || '';
    if (subject.toLowerCase().includes('math')) {
      return { text: 'Math', color: '#6366f1' };
    } else if (subject.toLowerCase().includes('english')) {
      return { text: 'English', color: '#10b981' };
    }
    return null;
  };

  const displayExams = teacherSubject ? filteredExams : exams;

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1 className="welcome-greeting">
                Hello, <span className="teacher-name">{teacherName}</span>! 👋
              </h1>
              <p className="dashboard-subtitle">
                {teacherSubject
                  ? `Manage your ${teacherSubject} exams and assessments`
                  : 'Manage and create your assessments'
                }
              </p>
            </div>
          </div>
          <button className="create-new-btn" onClick={handleCreateNew}>
            Create New Exam
          </button>
        </div>

        <div className="dashboard-content">
          {loading ? (
            <div className="loading-state">Loading exams...</div>
          ) : (
            <div className="exams-grid">
              {displayExams.map((exam) => {
                const subjectBadge = getSubjectBadge(exam);
                return (
                  <div key={exam.id} className="exam-card">
                    <div className="exam-card-header">
                      <div className="exam-icon">📋</div>
                      {subjectBadge && (
                        <div className="subject-badge" style={{ color: subjectBadge.color }}>
                          {subjectBadge.text}
                        </div>
                      )}
                    </div>
                    <div className="exam-card-body">
                      <h3 className="exam-title">{exam.title || 'Untitled Exam'}</h3>
                      <div className="exam-details">
                        <span>{formatDate(exam.created_at)}</span>
                        <span>{exam.questions?.length || 0} Questions</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="recent-results" style={{ marginTop: '40px' }}>
            <h2>Recent Student Submissions</h2>
            {reports.length === 0 ? (
              <p>No submissions yet.</p>
            ) : (
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report.id} style={{ padding: '15px', background: 'white', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <strong>Student ID: {report.student_id}</strong>
                    <span style={{ marginLeft: '20px' }}>Score: {report.score}/{report.total} ({Math.round(report.percentage)}%)</span>
                    <span style={{ float: 'right', color: '#64748b' }}>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
