import React, { useState } from 'react';
import { useExam } from '../context/ExamContext';
import { User, Timer, BarChart2, AlertTriangle } from 'lucide-react';
import ExamTimer from '../components/ExamTimer';
import { useNavigate } from 'react-router-dom';
import { submitExamAnswer, completeExamSession } from '../services/api';
import '../styles/exam.css';

const Assessment = () => {
    const { examInfo, questions, currentPageIndex, answers, setAnswer, goNextPage, QUESTIONS_PER_PAGE, submitGlobalExam, loading, sessionToken } = useExam();
    const navigate = useNavigate();

    const startIndex = currentPageIndex * QUESTIONS_PER_PAGE;
    const currentQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

    // Placeholder data for the info panel
    const studentInfo = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('studentData') || '{}');
    const studentName = studentInfo.firstName || studentInfo.name || 'Student';
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).filter(key => {
        // Only count answers for valid questions
        return questions.some(q => q.id === key || q._id === key);
    }).length;

    if (loading) {
        return <div className="exam-layout"><div className="exam-container"><h1>Loading Assessment...</h1></div></div>;
    }

    const handleOptionChange = async (questionId, value) => {
        setAnswer(questionId, value);
        if (sessionToken) {
            try {
                await submitExamAnswer(sessionToken, questionId, value);
            } catch (err) {
                console.error("Failed to sync answer:", err);
            }
        }
    };

    const handleTextChange = async (questionId, e) => {
        const val = e.target.value;
        setAnswer(questionId, val);
        // We might want to debounce this in a real app
        if (sessionToken) {
            try {
                await submitExamAnswer(sessionToken, questionId, val);
            } catch (err) {
                console.error("Failed to sync answer:", err);
            }
        }
    };

    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
    const isLastPage = currentPageIndex === totalPages - 1;

    const [showWarning, setShowWarning] = useState(false);

    const handleNextClick = () => {
        setShowWarning(true);
    };

    const confirmNavigation = () => {
        setShowWarning(false);
        if (isLastPage) {
            submitExam();
        } else {
            goNextPage();
            window.scrollTo(0, 0);
        }
    };

    const cancelNavigation = () => {
        setShowWarning(false);
    };

    const submitExam = async () => {
        if (sessionToken) {
            try {
                await completeExamSession(sessionToken);
            } catch (err) {
                console.error("Failed to complete session on backend:", err);
            }
        }
        submitGlobalExam();
        navigate('/result', { state: { totalQuestions, answeredCount, sessionToken } });
    };

    // If we ran out of questions, show a simple finish message
    if (currentQuestions.length === 0) {
        return (
            <div className="exam-layout">
                <div className="exam-container">
                    <div className="exam-header">
                        <h1>Exam Completed</h1>
                        <p className="subtitle">Thank you for completing the assessment.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="exam-layout">
            <div className="exam-container">
                {/* Decorative background elements */}
                <div className="left-decorative">
                    <div className="left-circle-1" />
                    <div className="left-circle-2" />
                    <div className="left-dot-1" />
                    <div className="left-line-1" />
                </div>

                <div className="exam-header">
                    <div className="header-title">
                        <h1>Validation Assessment</h1>
                        <p className="subtitle">Page {currentPageIndex + 1} of {totalPages}</p>
                    </div>
                    <div className="header-info">
                        <div className="info-chip student-chip">
                            <div className="icon-box">
                                <User size={18} />
                            </div>
                            <div className="chip-content">
                                <span className="chip-label">Student</span>
                                <span className="chip-value">{studentName}</span>
                            </div>
                        </div>
                        <div className="info-chip timer-chip">
                            <div className="icon-box">
                                <Timer size={18} />
                            </div>
                            <div className="chip-content">
                                <span className="chip-label">Time Remaining</span>
                                <div className="chip-value timer-wrapper">
                                    <ExamTimer initialSeconds={(examInfo?.duration_minutes || examInfo?.duration || 45) * 60} onExpire={submitExam} />
                                </div>
                            </div>
                        </div>
                        <div className="info-chip progress-chip">
                            <div className="icon-box">
                                <BarChart2 size={18} />
                            </div>
                            <div className="chip-content">
                                <span className="chip-label">Progress</span>
                                <span className="chip-value">{answeredCount} / {totalQuestions} answered</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="questions-list">
                    {currentQuestions.map((q, index) => {
                        const qId = q._id || q.id;
                        const options = q.options || {};
                        const isMcq = q.type?.toLowerCase() === 'mcq' || !!q.options;

                        return (
                            <div key={qId} className="question-card">
                                <div className="question-text">
                                    {startIndex + index + 1}. {q.statement || q.text}
                                </div>

                                {isMcq && (
                                    <div className="question-options">
                                        {Object.entries(options).map(([key, text]) => (
                                            <label key={key} className="option-label">
                                                <input
                                                    type="radio"
                                                    name={`q-${qId}`}
                                                    value={key}
                                                    checked={answers[qId] === key}
                                                    onChange={() => handleOptionChange(qId, key)}
                                                />
                                                <span className="option-letter">{key.toUpperCase()}.</span> {text}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {!isMcq && (
                                    <div className="question-input">
                                        <input
                                            type="text"
                                            className="short-answer-input"
                                            placeholder="Type your answer here..."
                                            value={answers[qId] || ''}
                                            onChange={(e) => handleTextChange(qId, e)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="navigation-area">
                    <button className="next-button" onClick={handleNextClick}>
                        {isLastPage ? 'Submit Assessment' : 'Next Page →'}
                    </button>
                </div>

                {/* Custom Warning Modal */}
                {showWarning && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-icon warning">
                                <AlertTriangle size={32} />
                            </div>
                            <h2>{isLastPage ? 'Submit Assessment?' : 'Are you sure?'}</h2>
                            <p>
                                {isLastPage
                                    ? "You are about to submit your exam. You cannot change your answers after this."
                                    : "You cannot go back and edit your answers after continuing. Do you want to proceed?"}
                            </p>
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={cancelNavigation}>Cancel</button>
                                <button className="btn-primary" onClick={confirmNavigation}>
                                    {isLastPage ? 'Submit' : 'Proceed'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Assessment;
