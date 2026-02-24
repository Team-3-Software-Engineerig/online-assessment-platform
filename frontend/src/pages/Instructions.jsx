import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { examService } from '../services/examService';
import { isExamAssignedToStudent, getStudentId } from '../utils/assignmentUtils';

const Instructions = () => {
  const navigate = useNavigate();
  const { startExam, loading: examLoading } = useExam();
  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const studentName = userData.name || userData.firstName || 'Student';

  // Access control: check if this student is assigned to the selected exam
  const selectedExamId = localStorage.getItem('selectedExamId');
  const studentId = getStudentId() || userData.id;

  // Only enforce the guard when an examId is explicitly selected
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const exams = await examService.getActiveExams();
        setActiveExams(exams);
      } catch (err) {
        console.error("Failed to fetch exams:", err);
        setError("Could not load available exams. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();

    if (selectedExamId && studentId) {
      const allowed = isExamAssignedToStudent(selectedExamId, studentId);
      if (!allowed) setAccessDenied(true);
    }
  }, [selectedExamId, studentId]);

  const handleStartExam = async () => {
    if (activeExams.length === 0 && !selectedExamId) {
      alert("No active exams available at this time.");
      return;
    }

    // If we have a selected exam via the dashboard, use that
    const examToStart = selectedExamId || (activeExams.find(e => e.subject === 'math') || activeExams[0])?.id;

    if (!examToStart) {
      alert("No exam selected.");
      return;
    }

    const success = await startExam(studentId, examToStart);

    if (success) {
      navigate('/exam');
    } else {
      alert("Failed to start the exam. Please try again.");
    }
  };

  if (loading) return <div className="loading">Loading instructions...</div>;

  // ── Access Denied screen ────────────────────────────────────
  if (accessDenied) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '48px 40px',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          border: '2px solid #fee2e2',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0 0 12px',
          }}>
            Access Denied
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#64748b',
            margin: '0 0 8px',
            lineHeight: 1.6,
          }}>
            You are not assigned to this exam.
          </p>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0 0 32px',
            lineHeight: 1.6,
          }}>
            Please contact your teacher if you believe this is a mistake, or check your assigned exams.
          </p>
          <button
            onClick={() => navigate('/student/exams')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            ← Back to My Exams
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="instructions-layout">
      <div className="instructions-container">
        <div className="left-decorative">
          <div className="left-circle-1" />
          <div className="left-circle-2" />
          <div className="left-dot-1" />
          <div className="left-dot-2" />
          <div className="left-dot-3" />
          <div className="left-line-1" />
          <div className="left-line-2" />
        </div>
        <div className="instructions-card">
          <div className="instructions-header">
            <h1>Exam Instructions</h1>
            <p className="subtitle">
              Please read the following instructions carefully before starting the assessment
            </p>
          </div>

          <div className="instructions-content">
            <div className="welcome-section">
              <div className="welcome-icon">👋</div>
              <div className="welcome-text">
                <p>Welcome back,</p>
                <h2>{studentName}!</h2>
                <span className="welcome-subtitle">Ready to showcase your skills?</span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="instructions-section">
              <div className="section-header">
                <span className="section-icon">📋</span>
                <h3 className="section-title">Quick Overview</h3>
              </div>
              <ul className="instructions-list">
                <li><span className="bullet-icon">✓</span>Math &amp; English assessment - placement test only</li>
                <li><span className="bullet-icon">✓</span>Timed exam with countdown timer</li>
                <li><span className="bullet-icon">✓</span>Can review answers before final submission</li>
                <li><span className="bullet-icon">✓</span>Cannot pause or leave during the exam</li>
              </ul>
            </div>

            <div className="instructions-section">
              <div className="section-header">
                <span className="section-icon">🎯</span>
                <h3 className="section-title">Before You Start</h3>
              </div>
              <ul className="instructions-list">
                <li><span className="bullet-icon">→</span>Find a quiet, comfortable place</li>
                <li><span className="bullet-icon">→</span>Ensure stable internet connection</li>
                <li><span className="bullet-icon">→</span>Close unnecessary browser tabs</li>
                <li><span className="bullet-icon">→</span>Have all materials you may need ready</li>
              </ul>
            </div>

            <button
              type="button"
              className="start-exam-button"
              onClick={handleStartExam}
              disabled={examLoading || activeExams.length === 0}
            >
              {examLoading ? 'Starting...' : 'Start Exam'}
            </button>

            <p className="instructions-note">
              By clicking "Start Exam," you confirm you've read and understood these instructions.
            </p>
          </div>
        </div>
      </div>

      <div className="instructions-info-panel">
        <div className="info-visual">
          <div className="illustration-circle-1 illustration-element" />
          <div className="illustration-circle-2 illustration-element" />
          <div className="illustration-circle-3 illustration-element" />
          <div className="illustration-circle-4 illustration-element" />
          <div className="illustration-book" />
          <div className="illustration-plant" />
          <div className="illustration-triangle" />
          <div className="illustration-line illustration-line-1" />
          <div className="illustration-line illustration-line-2" />
          <div className="illustration-dot illustration-dot-1" />
          <div className="illustration-dot illustration-dot-2" />
          <div className="illustration-dot illustration-dot-3" />
          <div className="illustration-dot illustration-dot-4" />
        </div>

        <div className="info-content">
          <div className="info-badge">Get Ready</div>
          <h1 className="info-title">Math &amp; English Skills Assessment</h1>
          <p className="info-text">
            You're all set! Take a moment to review the instructions to ensure you're ready for a successful assessment experience.
          </p>

          <div className="info-points">
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Clear and comprehensive instructions</p>
            </div>
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Real-time progress tracking</p>
            </div>
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Review your answers before submission</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
