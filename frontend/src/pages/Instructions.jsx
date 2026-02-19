import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { examService } from '../services/examService';
import './Instructions.css';

const Instructions = () => {
  const navigate = useNavigate();
  const { startExam, loading: examLoading } = useExam();
  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const studentName = userData.name || 'Student';

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
  }, []);

  const handleStartExam = async () => {
    if (activeExams.length === 0) {
      alert("No active exams available at this time.");
      return;
    }

    // For this prototype, we just pick the first available math exam
    const mathExam = activeExams.find(e => e.subject === 'math') || activeExams[0];
    const success = await startExam(userData.id, mathExam.id);

    if (success) {
      navigate('/exam');
    } else {
      alert("Failed to start the exam. Please try again.");
    }
  };

  if (loading) return <div className="loading">Loading instructions...</div>;

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
                <li><span className="bullet-icon">✓</span>Math & English assessment - placement test only</li>
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
