import React, { useState, useEffect } from 'react';
import { useExam } from '../context/ExamContext';
import { User, Timer, BarChart2, AlertTriangle } from 'lucide-react';
import ExamTimer from '../components/ExamTimer';
import { useNavigate } from 'react-router-dom';
import '../styles/exam.css';

const Assessment = () => {
    const {
        currentPageIndex,
        answers,
        questions,
        setAnswer,
        goNextPage,
        QUESTIONS_PER_PAGE,
        submitGlobalExam,
        durationMinutes,
        loading,
        sessionToken
    } = useExam();
    const navigate = useNavigate();

    const [showWarning, setShowWarning] = useState(false);

    // Redirect if no session
    useEffect(() => {
        if (!sessionToken && !loading) {
            navigate('/instructions');
        }
    }, [sessionToken, loading, navigate]);

    const startIndex = currentPageIndex * QUESTIONS_PER_PAGE;
    const currentQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const studentName = userData.name || 'Student';

    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;

    const handleOptionChange = (questionId, value) => {
        setAnswer(questionId, value);
    };

    const handleTextChange = (questionId, e) => {
        setAnswer(questionId, e.target.value);
    };

    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
    const isLastPage = currentPageIndex === totalPages - 1 || totalPages === 0;

    const handleNextClick = () => {
        setShowWarning(true);
    };

    const confirmNavigation = async () => {
        setShowWarning(false);
        if (isLastPage) {
            await handleFinalSubmit();
        } else {
            goNextPage();
            window.scrollTo(0, 0);
        }
    };

    const cancelNavigation = () => {
        setShowWarning(false);
    };

    const handleFinalSubmit = async () => {
        const result = await submitGlobalExam();
        if (result.success) {
            navigate('/result', { state: { totalQuestions, answeredCount, sessionId: result.sessionId } });
        } else {
            alert("Failed to submit exam. Please check your connection and try again.");
        }
    };

    if (loading) return <div className="loading">Loading assessment...</div>;

    if (questions.length === 0 && !loading) {
        return (
            <div className="exam-layout">
                <div className="exam-container">
                    <div className="exam-header">
                        <h1>No Questions Found</h1>
                        <p className="subtitle">This exam doesn't seem to have any questions. Please contact your administrator.</p>
                        <button onClick={() => navigate('/select-role')} className="btn-primary">Go Back</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="exam-layout">
            <div className="exam-container">
                <div className="left-decorative">
                    <div className="left-circle-1" />
                    <div className="left-circle-2" />
                    <div className="left-dot-1" />
                    <div className="left-line-1" />
                </div>

                <div className="exam-header">
                    <div className="header-title">
                        <h1>Validation Assessment</h1>
                        <p className="subtitle">Page {currentPageIndex + 1} of {totalPages || 1}</p>
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
                                    <ExamTimer initialSeconds={durationMinutes * 60} onExpire={handleFinalSubmit} />
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
                    {currentQuestions.map((q, index) => (
                        <div key={q.id} className="question-card">
                            <div className="question-text">
                                {startIndex + index + 1}. {q.statement}
                            </div>

                            {q.type === 'MCQ' && q.options && (
                                <div className="question-options">
                                    {Object.entries(q.options).map(([key, value]) => (
                                        <label key={key} className="option-label">
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                value={key}
                                                checked={answers[q.id] === key}
                                                onChange={() => handleOptionChange(q.id, key)}
                                            />
                                            {key.toUpperCase()}) {value}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'Open-ended' && (
                                <div className="question-input">
                                    <input
                                        type="text"
                                        className="short-answer-input"
                                        placeholder="Type your answer here..."
                                        value={answers[q.id] || ''}
                                        onChange={(e) => handleTextChange(q.id, e)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="navigation-area">
                    <button className="next-button" onClick={handleNextClick}>
                        {isLastPage ? 'Submit Assessment' : 'Next Page →'}
                    </button>
                </div>

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
