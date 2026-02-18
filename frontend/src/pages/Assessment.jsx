import React, { useState } from 'react';
import { useExam } from '../context/ExamContext';
import { User, Timer, BarChart2, AlertTriangle } from 'lucide-react';
import ExamTimer from '../components/ExamTimer';
import { useNavigate } from 'react-router-dom';
import '../styles/exam.css';

const DUMMY_QUESTIONS = [
    { id: 1, text: "What is 5 + 7?", type: "mcq", options: ["10", "11", "12", "13"] },
    { id: 2, text: "Identify the noun in this sentence: 'The cat sleeps.'", type: "mcq", options: ["The", "cat", "sleeps", "."] },
    { id: 3, text: "Solve for x: 2x = 10", type: "short", label: "Answer:" },
    { id: 4, text: "Which color is primary?", type: "mcq", options: ["Green", "Purple", "Red", "Orange"] },
    { id: 5, text: "Write the past tense of 'run'.", type: "short", label: "Answer:" },
    { id: 6, text: "What is 15 - 6?", type: "mcq", options: ["7", "8", "9", "10"] },
    { id: 7, text: "Which word is an adjective? 'The red ball.'", type: "mcq", options: ["The", "red", "ball", "None"] },
    { id: 8, text: "Capital of France?", type: "short", label: "City:" },
    { id: 9, text: "3 * 4 = ?", type: "mcq", options: ["7", "12", "14", "9"] },
    { id: 10, text: "Antonym of 'Hot'?", type: "short", label: "Word:" },
    { id: 11, text: "What is 20 / 5?", type: "mcq", options: ["2", "4", "5", "10"] },
    { id: 12, text: "Select the verb: 'He runs fast.'", type: "mcq", options: ["He", "runs", "fast", "."] },
];

const Assessment = () => {
    const { currentPageIndex, answers, setAnswer, goNextPage, QUESTIONS_PER_PAGE, submitGlobalExam } = useExam();
    const navigate = useNavigate();

    const startIndex = currentPageIndex * QUESTIONS_PER_PAGE;
    const currentQuestions = DUMMY_QUESTIONS.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

    // Placeholder data for the info panel
    const studentName = JSON.parse(localStorage.getItem('studentData') || '{}').firstName || 'Student';
    const totalQuestions = DUMMY_QUESTIONS.length;
    const answeredCount = Object.keys(answers).filter(key => {
        // Only count answers for valid questions
        return DUMMY_QUESTIONS.some(q => q.id === parseInt(key));
    }).length;

    const handleOptionChange = (questionId, value) => {
        setAnswer(questionId, value);
    };

    const handleTextChange = (questionId, e) => {
        setAnswer(questionId, e.target.value);
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

    const submitExam = () => {
        submitGlobalExam();
        navigate('/result', { state: { totalQuestions, answeredCount } });
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
                                    <ExamTimer initialSeconds={45 * 60} onExpire={submitExam} />
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
                                {startIndex + index + 1}. {q.text}
                            </div>

                            {q.type === 'mcq' && (
                                <div className="question-options">
                                    {q.options.map((option) => (
                                        <label key={option} className="option-label">
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                value={option}
                                                checked={answers[q.id] === option}
                                                onChange={() => handleOptionChange(q.id, option)}
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'short' && (
                                <div className="question-input">
                                    <input
                                        type="text"
                                        className="short-answer-input"
                                        placeholder={q.label}
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
