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
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState(null);

  useEffect(() => {
    // Get teacher info from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setTeacherName(user.firstName || 'Teacher');
        // Check if teacher has a subject assigned (e.g., 'math', 'english')
        setTeacherSubject(user.subject || user.teacherSubject || null);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    
    fetchExams();
  }, []);

  useEffect(() => {
    // Filter exams by subject if teacher is subject-specific
    if (teacherSubject) {
      const filtered = exams.filter(exam => {
        const examSubject = exam.subject?.toLowerCase() || 
                           exam.subject_type?.toLowerCase() || 
                           exam.title?.toLowerCase() || '';
        return examSubject.includes(teacherSubject.toLowerCase());
      });
      setFilteredExams(filtered);
    } else {
      // If no specific subject, show all exams
      setFilteredExams(exams);
    }
  }, [exams, teacherSubject]);

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
    // Navigate to create exam page (to be implemented)
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
  const subjectText = teacherSubject ? ` (${teacherSubject.charAt(0).toUpperCase() + teacherSubject.slice(1)} only)` : '';

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-container">
        {/* Header */}
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
            {teacherSubject && (
              <div className="subject-badge-large">
                <span className="subject-icon">
                  {teacherSubject.toLowerCase() === 'math' ? '🔢' : '📚'}
                </span>
                <span>{teacherSubject.charAt(0).toUpperCase() + teacherSubject.slice(1)} Teacher</span>
              </div>
            )}
          </div>
          <button className="create-new-btn" onClick={handleCreateNew}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create New Exam
          </button>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading exams...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p className="error-message">{error}</p>
              <button className="retry-btn" onClick={fetchExams}>
                Try Again
              </button>
            </div>
          ) : displayExams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h2>
                {teacherSubject 
                  ? `No ${teacherSubject} exams yet`
                  : 'No exams yet'
                }
              </h2>
              <p>
                {teacherSubject
                  ? `Get started by creating your first ${teacherSubject} exam`
                  : 'Get started by creating your first exam'
                }
              </p>
              <button className="create-first-btn" onClick={handleCreateNew}>
                Create Your First Exam
              </button>
            </div>
          ) : (
            <>
              {teacherSubject && filteredExams.length < exams.length && (
                <div className="filter-notice">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Showing only {teacherSubject} exams ({filteredExams.length} of {exams.length} total)</span>
                </div>
              )}
              <div className="exams-grid">
                {displayExams.map((exam) => {
                  const subjectBadge = getSubjectBadge(exam);
                  return (
                    <div key={exam.id} className="exam-card">
                      <div className="exam-card-header">
                        <div className="exam-icon">📋</div>
                        <div className="exam-header-badges">
                          {subjectBadge && (
                            <div 
                              className="subject-badge" 
                              style={{ background: `${subjectBadge.color}15`, color: subjectBadge.color }}
                            >
                              {subjectBadge.text}
                            </div>
                          )}
                          <div className="exam-status">
                            {exam.status || 'Active'}
                          </div>
                        </div>
                      </div>
                      <div className="exam-card-body">
                        <h3 className="exam-title">{exam.title || exam.name || 'Untitled Exam'}</h3>
                        <div className="exam-details">
                          <div className="exam-detail-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{formatDate(exam.created_at || exam.createdAt || exam.date)}</span>
                          </div>
                          <div className="exam-detail-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H16M12 16H16M8 12H8.01M8 16H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{exam.total_questions || exam.questionCount || exam.questions_count || 0} Questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="exam-card-footer">
                        <button className="view-exam-btn">
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
