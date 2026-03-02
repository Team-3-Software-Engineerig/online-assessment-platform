import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExam } from '../services/api';
import { generateTeacherExamPdf } from '../utils/teacherExamPdf';
import './CreateExam.css';

/* ── tiny helpers ──────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const makeOption = () => ({ id: uid(), text: '', isCorrect: false });

const freshBuilder = () => ({
    questionText: '',
    options: [makeOption(), makeOption(), makeOption(), makeOption()],
    errors: {},
});

/* ═══════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════ */
const CreateExam = () => {
    const navigate = useNavigate();

    /* ── exam-level state ── */
    const [examTitle, setExamTitle] = useState('');
    const [examSubject, setExamSubject] = useState('');
    const [examDuration, setExamDuration] = useState('');
    const [detailErrors, setDetailErrors] = useState({});

    /* ── confirmed questions ── */
    const [questions, setQuestions] = useState([]);

    /* ── inline question builder state ── */
    const [builder, setBuilder] = useState(freshBuilder());
    const [builderCollapsed, setBuilderCollapsed] = useState(false);

    /* ── submission ── */
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'
    const [submitMessage, setSubmitMessage] = useState('');
    const [savedExamData, setSavedExamData] = useState(null); // snapshot for PDF

    /* ════════════════════════════════════
       BUILDER helpers
    ════════════════════════════════════ */
    const setBuilderField = (key, value) =>
        setBuilder(prev => ({ ...prev, [key]: value }));

    const clearBuilderError = (...keys) =>
        setBuilder(prev => {
            const errors = { ...prev.errors };
            keys.forEach(k => delete errors[k]);
            return { ...prev, errors };
        });

    const handleBuilderQuestionText = (value) => {
        setBuilderField('questionText', value);
        if (builder.errors.questionText) clearBuilderError('questionText');
    };

    const handleOptionText = (id, value) => {
        setBuilder(prev => ({
            ...prev,
            options: prev.options.map(o => (o.id === id ? { ...o, text: value } : o)),
        }));
        clearBuilderError(`opt_${id}`);
    };

    const handleCorrect = (id) => {
        setBuilder(prev => ({
            ...prev,
            options: prev.options.map(o => ({ ...o, isCorrect: o.id === id })),
        }));
        clearBuilderError('correct');
    };

    const handleAddOption = () =>
        setBuilder(prev => ({ ...prev, options: [...prev.options, makeOption()] }));

    const handleRemoveOption = (id) => {
        if (builder.options.length <= 4) return;
        setBuilder(prev => ({
            ...prev,
            options: prev.options.filter(o => o.id !== id),
        }));
        clearBuilderError(`opt_${id}`);
    };

    /* ════════════════════════════════════
       Validate & add question to list
    ════════════════════════════════════ */
    const validateBuilder = () => {
        const errs = {};
        if (!builder.questionText.trim())
            errs.questionText = 'Question text cannot be empty.';
        builder.options.forEach((o, idx) => {
            if (!o.text.trim())
                errs[`opt_${o.id}`] = `Option ${LETTERS[idx]} cannot be empty.`;
        });
        const cCount = builder.options.filter(o => o.isCorrect).length;
        if (cCount === 0) errs.correct = 'Select the correct answer.';
        return errs;
    };

    const handleAddToExam = () => {
        const errs = validateBuilder();
        if (Object.keys(errs).length > 0) {
            setBuilder(prev => ({ ...prev, errors: errs }));
            return;
        }
        const newQ = {
            id: uid(),
            questionText: builder.questionText.trim(),
            options: builder.options.map(({ text, isCorrect }) => ({
                text: text.trim(),
                isCorrect,
            })),
        };
        setQuestions(prev => [...prev, newQ]);
        setBuilder(freshBuilder()); // reset form for next question
        setBuilderCollapsed(false); // keep builder open
    };

    /* ════════════════════════════════════
       Remove a confirmed question
    ════════════════════════════════════ */
    const handleRemoveQuestion = (id) =>
        setQuestions(prev => prev.filter(q => q.id !== id));

    /* ════════════════════════════════════
       Validate exam-level fields
    ════════════════════════════════════ */
    const validateDetails = () => {
        const errs = {};
        if (!examTitle.trim()) errs.title = 'Exam title is required.';
        if (!examSubject.trim()) errs.subject = 'Subject is required.';
        if (!examDuration || isNaN(examDuration) || Number(examDuration) < 1)
            errs.duration = 'Enter a valid duration (minutes).';
        return errs;
    };

    /* ════════════════════════════════════
       Final submit
    ════════════════════════════════════ */
    const handleSaveExam = async () => {
        setSubmitStatus(null);
        setSubmitMessage('');

        const detErrs = validateDetails();
        if (Object.keys(detErrs).length > 0) {
            setDetailErrors(detErrs);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setDetailErrors({});

        if (questions.length === 0) {
            setSubmitStatus('error');
            setSubmitMessage('Please add at least one question before saving.');
            return;
        }

        setSubmitting(true);
        try {
            // Resolve teacher name from localStorage (set during registration)
            const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');
            const teacherName = teacherData.firstName
                ? `${teacherData.firstName} ${teacherData.lastName || ''}`.trim()
                : undefined;

            const payload = {
                title: examTitle.trim(),
                subject: examSubject.trim(),
                duration: Number(examDuration),
                questions: questions.map(({ questionText, options }) => ({
                    questionText,
                    // Strip isCorrect — we pass only text to the API
                    options: options.map(({ text }) => ({ text })),
                })),
            };
            const response = await createExam(payload);
            if (response.success) {
                // Store a PDF-ready snapshot (questions with full option text only — no correct info)
                setSavedExamData({
                    title: payload.title,
                    subject: payload.subject,
                    duration: payload.duration,
                    teacherName,
                    examId: response.data?.id ? `EX-${String(response.data.id).slice(-6)}` : undefined,
                    createdAt: new Date().toISOString(),
                    questions: questions.map(q => ({
                        questionText: q.questionText,
                        options: q.options.map(o => ({ text: o.text })), // no isCorrect
                    })),
                });
                setSubmitStatus('success');
                setSubmitMessage(response.message || 'Exam created successfully!');
            } else {
                setSubmitStatus('error');
                setSubmitMessage(response.message || 'Failed to create exam. Please try again.');
            }
        } catch (err) {
            setSubmitStatus('error');
            setSubmitMessage(err.message || 'An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ════════════════════════════════════
       Render helpers
    ════════════════════════════════════ */
    const hasBuilderErrors = Object.keys(builder.errors).length > 0;

    /* ── render ──────────────────────────────────────── */
    return (
        <div className="create-exam-page">
            <div className="create-exam-container">

                {/* ── Page Header ── */}
                <div className="ce-header">
                    <button
                        className="ce-back-btn"
                        onClick={() => navigate('/teacher/dashboard')}
                        type="button"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back
                    </button>
                    <div className="ce-title-group">
                        <h1 className="ce-page-title">Create <span>New Exam</span></h1>
                        <p className="ce-page-subtitle">
                            Fill in exam details, add as many questions as you like, then save.
                        </p>
                    </div>
                </div>

                {/* ── Success Banner ── */}
                {submitStatus === 'success' && (
                    <div className="ce-banner ce-banner-success">
                        <span className="ce-banner-icon">🎉</span>
                        <div className="ce-banner-body">
                            <p><strong>Exam saved!</strong> {submitMessage}</p>
                            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                    onClick={() => navigate('/teacher/dashboard')}
                                >
                                    ← Back to Dashboard
                                </button>
                                <button
                                    style={{
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                        color: 'white', border: 'none', borderRadius: 8,
                                        padding: '8px 16px', fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                        boxShadow: '0 4px 10px rgba(99,102,241,0.35)',
                                    }}
                                    onClick={() => savedExamData && generateTeacherExamPdf(savedExamData)}
                                    disabled={!savedExamData}
                                    title={savedExamData ? 'Download exam paper as PDF' : 'Preparing PDF…'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 3v13M7 11l5 5 5-5M5 20h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Download Exam (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Error Banner ── */}
                {submitStatus === 'error' && (
                    <div className="ce-banner ce-banner-error">
                        <span className="ce-banner-icon">⚠️</span>
                        <div className="ce-banner-body"><p>{submitMessage}</p></div>
                    </div>
                )}

                {/* ══════════════════════════════════════
            SECTION 1 — Exam Details
        ══════════════════════════════════════ */}
                <div className="ce-card">
                    <div className="ce-section-header">
                        <p className="ce-section-title">
                            <span className="ce-section-icon">📋</span>
                            Exam Details
                        </p>
                    </div>
                    <div className="ce-section-body">
                        <div className="ce-details-grid">
                            {/* Title */}
                            <div className="ce-field ce-field-full">
                                <label htmlFor="exam-title">
                                    Exam Title <span className="ce-required">*</span>
                                </label>
                                <input
                                    id="exam-title"
                                    type="text"
                                    className={`ce-input${detailErrors.title ? ' ce-input-error' : ''}`}
                                    placeholder="e.g. Mathematics Mid-Term Assessment"
                                    value={examTitle}
                                    onChange={e => {
                                        setExamTitle(e.target.value);
                                        if (detailErrors.title) setDetailErrors(p => { const n = { ...p }; delete n.title; return n; });
                                    }}
                                    disabled={submitting || submitStatus === 'success'}
                                />
                                {detailErrors.title && (
                                    <p className="ce-error-msg">⚠ {detailErrors.title}</p>
                                )}
                            </div>

                            {/* Subject */}
                            <div className="ce-field">
                                <label htmlFor="exam-subject">
                                    Subject <span className="ce-required">*</span>
                                </label>
                                <input
                                    id="exam-subject"
                                    type="text"
                                    className={`ce-input${detailErrors.subject ? ' ce-input-error' : ''}`}
                                    placeholder="e.g. Mathematics"
                                    value={examSubject}
                                    onChange={e => {
                                        setExamSubject(e.target.value);
                                        if (detailErrors.subject) setDetailErrors(p => { const n = { ...p }; delete n.subject; return n; });
                                    }}
                                    disabled={submitting || submitStatus === 'success'}
                                />
                                {detailErrors.subject && (
                                    <p className="ce-error-msg">⚠ {detailErrors.subject}</p>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="ce-field">
                                <label htmlFor="exam-duration">
                                    Duration (minutes) <span className="ce-required">*</span>
                                </label>
                                <input
                                    id="exam-duration"
                                    type="number"
                                    min="1"
                                    className={`ce-input${detailErrors.duration ? ' ce-input-error' : ''}`}
                                    placeholder="e.g. 60"
                                    value={examDuration}
                                    onChange={e => {
                                        setExamDuration(e.target.value);
                                        if (detailErrors.duration) setDetailErrors(p => { const n = { ...p }; delete n.duration; return n; });
                                    }}
                                    disabled={submitting || submitStatus === 'success'}
                                />
                                {detailErrors.duration && (
                                    <p className="ce-error-msg">⚠ {detailErrors.duration}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════
            SECTION 2 — Questions Added So Far
        ══════════════════════════════════════ */}
                <div className="ce-card">
                    <div className="ce-section-header">
                        <p className="ce-section-title">
                            <span className="ce-section-icon">📝</span>
                            Questions
                            {questions.length > 0 && (
                                <span className="ce-questions-badge">{questions.length}</span>
                            )}
                        </p>
                    </div>

                    <div className="ce-section-body">
                        {questions.length === 0 ? (
                            <div className="ce-questions-empty">
                                <span className="ce-questions-empty-icon">📭</span>
                                <p>No questions added yet</p>
                                <small>Use the builder below to add your first question.</small>
                            </div>
                        ) : (
                            <div className="ce-question-list">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="ce-question-item">
                                        <div className="ce-q-number">{idx + 1}</div>
                                        <div className="ce-q-body">
                                            <p className="ce-q-text">{q.questionText}</p>
                                            <div className="ce-q-options">
                                                {q.options.map((o, oi) => (
                                                    <span
                                                        key={oi}
                                                        className={`ce-q-option-chip${o.isCorrect ? ' correct' : ''}`}
                                                        title={o.isCorrect ? 'Correct answer' : ''}
                                                    >
                                                        {LETTERS[oi]}. {o.text}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            className="ce-q-remove"
                                            onClick={() => handleRemoveQuestion(q.id)}
                                            title="Remove question"
                                            disabled={submitting || submitStatus === 'success'}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════
              SECTION 3 — Inline Question Builder
          ══════════════════════════════════════ */}
                    <div className="ce-builder-section">
                        <div className="ce-section-header">
                            <p className="ce-section-title">
                                <span className="ce-section-icon">✏️</span>
                                {builderCollapsed ? 'Add a Question (click to expand)' : 'Add a Question'}
                            </p>
                            <button
                                type="button"
                                className="ce-collapse-btn"
                                onClick={() => setBuilderCollapsed(v => !v)}
                            >
                                {builderCollapsed ? (
                                    <>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Expand
                                    </>
                                ) : (
                                    <>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Collapse
                                    </>
                                )}
                            </button>
                        </div>

                        {!builderCollapsed && (
                            <div className="ce-section-body">

                                {/* Builder error summary */}
                                {hasBuilderErrors && (
                                    <div className="ce-banner ce-banner-error" style={{ marginBottom: 20 }}>
                                        <span className="ce-banner-icon">⚠️</span>
                                        <div className="ce-banner-body">
                                            <p>Please fix the errors below before adding the question.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Question text */}
                                <div style={{ marginBottom: 20 }}>
                                    <label
                                        style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}
                                        htmlFor="builder-q-text"
                                    >
                                        Question Text <span className="ce-required">*</span>
                                    </label>
                                    <textarea
                                        id="builder-q-text"
                                        className={`ce-textarea${builder.errors.questionText ? ' ce-input-error' : ''}`}
                                        placeholder="Type your question here…"
                                        value={builder.questionText}
                                        onChange={e => handleBuilderQuestionText(e.target.value)}
                                        disabled={submitting || submitStatus === 'success'}
                                    />
                                    {builder.errors.questionText && (
                                        <p className="ce-error-msg">⚠ {builder.errors.questionText}</p>
                                    )}
                                </div>

                                {/* Options */}
                                <div>
                                    <div className="ce-options-header">
                                        <p className="ce-options-label">
                                            Options
                                            <span className="ce-options-hint">
                                                ({builder.options.length} · select correct)
                                            </span>
                                        </p>
                                        <button
                                            type="button"
                                            className="ce-add-opt-btn"
                                            onClick={handleAddOption}
                                            disabled={submitting || submitStatus === 'success'}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                            </svg>
                                            Add Option
                                        </button>
                                    </div>

                                    <div className="ce-option-rows">
                                        {builder.options.map((opt, idx) => (
                                            <div
                                                key={opt.id}
                                                className={`ce-option-row${opt.isCorrect ? ' selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="builder-correct"
                                                    className="ce-radio"
                                                    checked={opt.isCorrect}
                                                    onChange={() => handleCorrect(opt.id)}
                                                    disabled={submitting || submitStatus === 'success'}
                                                    title="Mark as correct"
                                                />
                                                <span className="ce-opt-letter">{LETTERS[idx] ?? idx + 1}</span>
                                                <input
                                                    type="text"
                                                    className={`ce-opt-input${builder.errors[`opt_${opt.id}`] ? ' ce-input-error' : ''}`}
                                                    placeholder={`Option ${LETTERS[idx] ?? idx + 1}`}
                                                    value={opt.text}
                                                    onChange={e => handleOptionText(opt.id, e.target.value)}
                                                    disabled={submitting || submitStatus === 'success'}
                                                />
                                                <button
                                                    type="button"
                                                    className="ce-opt-remove"
                                                    onClick={() => handleRemoveOption(opt.id)}
                                                    disabled={builder.options.length <= 4 || submitting || submitStatus === 'success'}
                                                    title={builder.options.length <= 4 ? 'Need at least 4 options' : 'Remove'}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Per-option errors */}
                                    {builder.options.map((opt, idx) =>
                                        builder.errors[`opt_${opt.id}`] ? (
                                            <p key={opt.id} className="ce-error-msg" style={{ marginTop: 4 }}>
                                                ⚠ Option {LETTERS[idx]}: {builder.errors[`opt_${opt.id}`]}
                                            </p>
                                        ) : null
                                    )}

                                    {/* Correct-answer error */}
                                    {builder.errors.correct && (
                                        <p className="ce-error-msg" style={{ marginTop: 8 }}>
                                            ⚠ {builder.errors.correct}
                                        </p>
                                    )}
                                </div>

                                {/* Add to exam button */}
                                <div className="ce-builder-footer">
                                    <button
                                        type="button"
                                        className="ce-add-question-btn"
                                        onClick={handleAddToExam}
                                        disabled={submitting || submitStatus === 'success'}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                        Add to Exam
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Submit Bar ── */}
                    <div className="ce-submit-bar">
                        <p className="ce-submit-info">
                            {questions.length === 0
                                ? 'No questions added yet'
                                : (
                                    <>
                                        <strong>{questions.length}</strong> question{questions.length !== 1 ? 's' : ''} ready
                                    </>
                                )
                            }
                        </p>
                        <div className="ce-submit-actions">
                            <button
                                type="button"
                                className="ce-cancel-btn"
                                onClick={() => navigate('/teacher/dashboard')}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ce-save-btn"
                                onClick={handleSaveExam}
                                disabled={submitting || submitStatus === 'success'}
                            >
                                {submitting ? (
                                    <>
                                        <span className="ce-spinner" />
                                        Saving Exam…
                                    </>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Save Exam
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CreateExam;
