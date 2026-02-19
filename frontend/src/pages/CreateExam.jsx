import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ChevronLeft } from 'lucide-react';
import './TeacherDashboard.css';

const CreateExam = () => {
    const navigate = useNavigate();
    const [examData, setExamData] = useState({
        title: '',
        subject: 'math',
        duration_minutes: 45,
        start_at: '',
        end_at: '',
    });

    const [questions, setQuestions] = useState([
        { number: 1, statement: '', type: 'MCQ', options: { a: '', b: '', c: '', d: '' }, answer: 'a' }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleExamChange = (e) => {
        const { name, value } = e.target;
        setExamData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        if (field.startsWith('option_')) {
            const opt = field.split('_')[1];
            newQuestions[index].options[opt] = value;
        } else {
            newQuestions[index][field] = value;
        }
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            number: questions.length + 1,
            statement: '',
            type: 'MCQ',
            options: { a: '', b: '', c: '', d: '' },
            answer: 'a'
        }]);
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        const newQuestions = questions.filter((_, i) => i !== index);
        // Re-number
        newQuestions.forEach((q, i) => q.number = i + 1);
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/admin/exams/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...examData,
                    questions: questions
                })
            });

            if (response.ok) {
                navigate('/teacher/dashboard');
            } else {
                const data = await response.json();
                setError(data.detail || 'Failed to create exam');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="teacher-dashboard">
            <div className="dashboard-container" style={{ maxWidth: '900px' }}>
                <div className="dashboard-header">
                    <button onClick={() => navigate('/teacher/dashboard')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronLeft size={18} /> Back
                    </button>
                    <h1>Create New Assessment</h1>
                </div>

                <form onSubmit={handleSubmit} className="exam-create-form">
                    <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'white', borderRadius: '16px' }}>
                        <h2 style={{ marginBottom: '16px' }}>Exam Settings</h2>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Exam Title</label>
                                <input name="title" value={examData.title} onChange={handleExamChange} className="form-input" placeholder="e.g. Midterm Math" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <select name="subject" value={examData.subject} onChange={handleExamChange} className="form-input">
                                    <option value="math">Mathematics</option>
                                    <option value="english">English</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Duration (minutes)</label>
                                <input type="number" name="duration_minutes" value={examData.duration_minutes} onChange={handleExamChange} className="form-input" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input type="datetime-local" name="start_at" value={examData.start_at} onChange={handleExamChange} className="form-input" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input type="datetime-local" name="end_at" value={examData.end_at} onChange={handleExamChange} className="form-input" required />
                            </div>
                        </div>
                    </div>

                    <div className="questions-section">
                        <h2 style={{ marginBottom: '16px' }}>Questions</h2>
                        {questions.map((q, index) => (
                            <div key={index} className="question-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h3>Question {q.number}</h3>
                                    <button type="button" onClick={() => removeQuestion(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Question Statement</label>
                                    <textarea
                                        value={q.statement}
                                        onChange={(e) => handleQuestionChange(index, 'statement', e.target.value)}
                                        className="form-input"
                                        placeholder="Enter the question here..."
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Question Type</label>
                                    <select
                                        value={q.type}
                                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                                        className="form-input"
                                    >
                                        <option value="MCQ">Multiple Choice</option>
                                        <option value="Open-ended">Open Ended</option>
                                    </select>
                                </div>

                                {q.type === 'MCQ' && (
                                    <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                        {['a', 'b', 'c', 'd'].map(opt => (
                                            <div key={opt}>
                                                <label className="form-label">Option {opt.toUpperCase()}</label>
                                                <input
                                                    value={q.options[opt]}
                                                    onChange={(e) => handleQuestionChange(index, `option_${opt}`, e.target.value)}
                                                    className="form-input"
                                                    placeholder={`Enter option ${opt}`}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="form-group" style={{ marginTop: '12px' }}>
                                    <label className="form-label">Correct Answer {q.type === 'MCQ' ? '(a, b, c, or d)' : ''}</label>
                                    <input
                                        value={q.answer}
                                        onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                                        className="form-input"
                                        placeholder="Correct answer"
                                        required
                                    />
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addQuestion} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', border: '2px dashed #cbd5e1' }}>
                            <Plus size={20} /> Add Question
                        </button>
                    </div>

                    {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}

                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="submit-button" disabled={isSubmitting} style={{ width: 'auto', padding: '16px 32px', fontSize: '18px' }}>
                            {isSubmitting ? 'Creating...' : 'Finalize and Save Exam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateExam;
