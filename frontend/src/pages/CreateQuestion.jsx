import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuestion } from '../services/questionService';
import './CreateQuestion.css';

/* ── helpers ─────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const makeOption = () => ({ id: uid(), text: '', isCorrect: false });

const buildInitialOptions = () => [
    makeOption(),
    makeOption(),
    makeOption(),
    makeOption(),
];

/* ── component ───────────────────────────────────── */
const CreateQuestion = () => {
    const navigate = useNavigate();

    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(buildInitialOptions);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
    const [submitMessage, setSubmitMessage] = useState('');

    /* ---- validation ---- */
    const validate = () => {
        const newErrors = {};

        if (!questionText.trim()) {
            newErrors.questionText = 'Question text cannot be empty.';
        }

        options.forEach((opt, idx) => {
            if (!opt.text.trim()) {
                newErrors[`option_${opt.id}`] = `Option ${LETTERS[idx]} cannot be empty.`;
            }
        });

        const correctCount = options.filter((o) => o.isCorrect).length;
        if (correctCount === 0) {
            newErrors.correct = 'Please select the correct answer.';
        } else if (correctCount > 1) {
            newErrors.correct = 'Only one option can be marked as correct.';
        }

        return newErrors;
    };

    /* ---- option handlers ---- */
    const handleAddOption = () => {
        setOptions((prev) => [...prev, makeOption()]);
    };

    const handleRemoveOption = (id) => {
        if (options.length <= 4) return;
        setOptions((prev) => prev.filter((o) => o.id !== id));
        // clear per-option error if removed
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`option_${id}`];
            return next;
        });
    };

    const handleOptionText = (id, value) => {
        setOptions((prev) =>
            prev.map((o) => (o.id === id ? { ...o, text: value } : o))
        );
        if (errors[`option_${id}`]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[`option_${id}`];
                return next;
            });
        }
    };

    const handleCorrectChange = (id) => {
        setOptions((prev) =>
            prev.map((o) => ({ ...o, isCorrect: o.id === id }))
        );
        if (errors.correct) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.correct;
                return next;
            });
        }
    };

    /* ---- submit ---- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus(null);
        setSubmitMessage('');

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const payload = {
                questionText: questionText.trim(),
                options: options.map(({ text, isCorrect }) => ({
                    text: text.trim(),
                    isCorrect,
                })),
            };

            const response = await createQuestion(payload);

            if (response.success) {
                setSubmitStatus('success');
                setSubmitMessage(response.message || 'Question created successfully!');
            } else {
                setSubmitStatus('error');
                setSubmitMessage(response.message || 'Failed to create question. Please try again.');
            }
        } catch (err) {
            setSubmitStatus('error');
            setSubmitMessage(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ---- reset for "Create another" ---- */
    const handleReset = () => {
        setQuestionText('');
        setOptions(buildInitialOptions());
        setErrors({});
        setSubmitStatus(null);
        setSubmitMessage('');
    };

    /* ---- count global errors ---- */
    const hasErrors = Object.keys(errors).length > 0;

    /* ── render ─────────────────────────────────────── */
    return (
        <div className="create-question-page">
            <div className="create-question-container">

                {/* Header */}
                <div className="cq-header">
                    <button
                        className="cq-back-btn"
                        onClick={() => navigate('/teacher/dashboard')}
                        type="button"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <div className="cq-title-group">
                        <h1 className="cq-page-title">
                            Create <span>MCQ Question</span>
                        </h1>
                        <p className="cq-page-subtitle">
                            Build a multiple-choice question with at least 4 options
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="cq-card">

                    {/* Success Banner */}
                    {submitStatus === 'success' && (
                        <div className="cq-banner cq-banner-success">
                            <span className="cq-banner-icon">✅</span>
                            <div className="cq-banner-body">
                                <p><strong>Question saved!</strong> {submitMessage}</p>
                                <button
                                    type="button"
                                    className="cq-banner-again-btn"
                                    onClick={handleReset}
                                >
                                    + Create Another Question
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Banner (global) */}
                    {submitStatus === 'error' && (
                        <div className="cq-banner cq-banner-error">
                            <span className="cq-banner-icon">⚠️</span>
                            <div className="cq-banner-body">
                                <p>{submitMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Validation error summary */}
                    {hasErrors && submitStatus !== 'success' && (
                        <div className="cq-banner cq-banner-error">
                            <span className="cq-banner-icon">⚠️</span>
                            <div className="cq-banner-body">
                                <p>Please fix the errors below before submitting.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>

                        {/* Question Text */}
                        <div className="cq-field">
                            <label className="cq-label" htmlFor="questionText">
                                Question Text <span className="cq-required">*</span>
                            </label>
                            <textarea
                                id="questionText"
                                className={`cq-textarea${errors.questionText ? ' cq-input-error' : ''}`}
                                placeholder="e.g. What is the value of π (pi) to two decimal places?"
                                value={questionText}
                                onChange={(e) => {
                                    setQuestionText(e.target.value);
                                    if (errors.questionText) {
                                        setErrors((prev) => { const n = { ...prev }; delete n.questionText; return n; });
                                    }
                                }}
                                rows={4}
                                disabled={submitting || submitStatus === 'success'}
                            />
                            {errors.questionText && (
                                <p className="cq-error-msg">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
                                    {errors.questionText}
                                </p>
                            )}
                        </div>

                        {/* Options */}
                        <div className="cq-field">
                            <div className="cq-options-header">
                                <p className="cq-options-label">
                                    Answer Options <span className="cq-required">*</span>
                                    <span className="cq-options-hint">
                                        ({options.length} options · select correct answer)
                                    </span>
                                </p>
                                <button
                                    type="button"
                                    className="cq-add-option-btn"
                                    onClick={handleAddOption}
                                    disabled={submitting || submitStatus === 'success'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                    Add Option
                                </button>
                            </div>

                            <div className="cq-options-list">
                                {options.map((opt, idx) => (
                                    <div
                                        key={opt.id}
                                        className={`cq-option-row${opt.isCorrect ? ' cq-option-selected' : ''}`}
                                    >
                                        {/* Radio */}
                                        <div className="cq-radio-wrapper">
                                            <input
                                                id={`radio-${opt.id}`}
                                                type="radio"
                                                name="correctOption"
                                                className="cq-radio"
                                                checked={opt.isCorrect}
                                                onChange={() => handleCorrectChange(opt.id)}
                                                disabled={submitting || submitStatus === 'success'}
                                                title="Mark as correct answer"
                                            />
                                        </div>

                                        {/* Letter Badge */}
                                        <span className="cq-option-letter" aria-hidden="true">
                                            {LETTERS[idx] ?? idx + 1}
                                        </span>

                                        {/* Input */}
                                        <div className="cq-option-input-wrapper">
                                            <input
                                                id={`option-${opt.id}`}
                                                type="text"
                                                className={`cq-option-input${errors[`option_${opt.id}`] ? ' cq-input-error' : ''}`}
                                                placeholder={`Option ${LETTERS[idx] ?? idx + 1}`}
                                                value={opt.text}
                                                onChange={(e) => handleOptionText(opt.id, e.target.value)}
                                                disabled={submitting || submitStatus === 'success'}
                                            />
                                            {errors[`option_${opt.id}`] && (
                                                <p className="cq-error-msg">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
                                                    {errors[`option_${opt.id}`]}
                                                </p>
                                            )}
                                            {opt.isCorrect && (
                                                <p className="cq-correct-label">
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    Correct Answer
                                                </p>
                                            )}
                                        </div>

                                        {/* Remove */}
                                        <button
                                            type="button"
                                            className="cq-remove-btn"
                                            onClick={() => handleRemoveOption(opt.id)}
                                            disabled={options.length <= 4 || submitting || submitStatus === 'success'}
                                            title={options.length <= 4 ? 'Need at least 4 options' : 'Remove option'}
                                            aria-label={`Remove option ${LETTERS[idx]}`}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Correct-answer error */}
                            {errors.correct && (
                                <p className="cq-error-msg cq-options-error">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
                                    {errors.correct}
                                </p>
                            )}
                        </div>

                        {/* Submit Row */}
                        <div className="cq-submit-row">
                            <button
                                type="button"
                                className="cq-cancel-btn"
                                onClick={() => navigate('/teacher/dashboard')}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="cq-submit-btn"
                                disabled={submitting || submitStatus === 'success'}
                            >
                                {submitting ? (
                                    <>
                                        <span className="cq-spinner" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Submit Question
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateQuestion;
