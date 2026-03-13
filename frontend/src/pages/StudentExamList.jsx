import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveExams } from '../services/api';
import './StudentExamList.css';

const StudentExamList = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    // Student info
    const studentData = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('studentData') || '{}');
    const firstName = studentData.firstName || studentData.name || 'Student';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await getActiveExams();
                if (res.success && res.data) {
                    setExams(res.data);
                }
            } catch (err) {
                console.error('Failed to load exams:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatDate = (ds) => {
        if (!ds) return '';
        try {
            return new Date(ds).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
            });
        } catch { return ds; }
    };

    const handleStart = (exam) => {
        // Store selected exam for the Instructions + Assessment pages
        localStorage.setItem('selectedExamId', String(exam.id));
        localStorage.setItem('selectedExam', JSON.stringify(exam));
        navigate('/instructions');
    };

    return (
        <div className="sel-page">
            <div className="sel-container">
                {/* Header */}
                <div className="sel-header">
                    <h1 className="sel-greeting">
                        Welcome, <span className="sel-greeting-name">{firstName}</span>! 👋
                    </h1>
                    <p className="sel-sub">Your assigned exams are listed below. Good luck!</p>
                </div>

                {loading ? (
                    <div className="sel-loading">
                        <div className="sel-spinner" />
                        <p>Loading your exams…</p>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="sel-empty">
                        <span className="sel-empty-icon">📭</span>
                        <h2>No exams assigned yet</h2>
                        <p>Your teacher hasn't assigned any exams to you. Check back later.</p>
                    </div>
                ) : (
                    <>
                        <p className="sel-section-count">
                            You have <span>{exams.length}</span> assigned exam{exams.length !== 1 ? 's' : ''}
                        </p>
                        <div className="sel-grid">
                            {exams.map((exam) => (
                                <div key={exam.id} className="sel-exam-card">
                                    <div className="sel-card-top">
                                        <div className="sel-card-icon">📋</div>
                                        <div className="sel-card-meta">
                                            <h3 className="sel-card-title">
                                                {exam.title || exam.name || 'Untitled Exam'}
                                            </h3>
                                            <div className="sel-card-sub">
                                                {exam.subject && <span>{exam.subject}</span>}
                                                {(exam.created_at || exam.createdAt) && (
                                                    <span>{formatDate(exam.created_at || exam.createdAt)}</span>
                                                )}
                                                {(exam.duration) && (
                                                    <span>⏱ {exam.duration} minutes</span>
                                                )}
                                            </div>
                                            <div className="sel-card-badge">
                                                {exam.status || 'Active'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className={`sel-start-btn ${exam.is_completed ? 'completed' : ''}`}
                                        onClick={() => !exam.is_completed && handleStart(exam)}
                                        disabled={exam.is_completed}
                                    >
                                        {exam.is_completed ? '✓ Exam Completed' : '→ Start Exam'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StudentExamList;
