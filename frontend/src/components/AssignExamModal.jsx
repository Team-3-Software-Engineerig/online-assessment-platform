import React, { useState, useEffect, useRef } from 'react';
import { getStudents, assignExam } from '../services/api';
import './AssignExamModal.css';

/**
 * AssignExamModal
 * Props:
 *   exam    — { id, title, ... }
 *   onClose — function to close the modal
 *   onSaved — function(studentIds: string[]) called after saving
 */
const AssignExamModal = ({ exam, onClose, onSaved }) => {
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [search, setSearch] = useState('');
    const searchRef = useRef(null);

    // ── Load students + pre-check already-assigned ─────────────
    useEffect(() => {
        const fetchData = async () => {
            let allStudents = [];

            try {
                const res = await getStudents();
                if (res.success && Array.isArray(res.data)) {
                    allStudents = res.data;
                }
            } catch (err) {
                console.error("Failed to fetch students from API:", err);
            }

            const alreadyPhones = new Set(
                (exam.assigned_students || []).map(String)
            );

            setStudents(allStudents);
            setSelected(alreadyPhones);
        };

        fetchData();

        // Focus search on open
        setTimeout(() => searchRef.current?.focus(), 50);
    }, [exam.id]);

    // ── Close on Escape ─────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // ── Filtered list ───────────────────────────────────────────
    const q = search.toLowerCase().trim();
    const filtered = q
        ? students.filter(
            (s) =>
                (s.name || '').toLowerCase().includes(q) ||
                (s.email || '').toLowerCase().includes(q) ||
                (s.mobilePhone || '').includes(q)
        )
        : students;

    // ── Select-all state ────────────────────────────────────────
    const filteredPhones = filtered.map((s) => s.mobilePhone || s.mobile_phone || s.id);
    const allChecked = filteredPhones.length > 0 && filteredPhones.every((p) => selected.has(p));
    const someChecked = filteredPhones.some((p) => selected.has(p)) && !allChecked;

    const handleSelectAll = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allChecked) {
                filteredPhones.forEach((p) => next.delete(p));
            } else {
                filteredPhones.forEach((p) => next.add(p));
            }
            return next;
        });
    };

    const handleToggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ── Save ────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const handleAssign = async () => {
        try {
            setIsSaving(true);
            const phones = [...selected];
            const res = await assignExam(exam.id, phones);
            if (res.success) {
                onSaved(phones);
            }
        } catch (err) {
            console.error("Failed to assign exam:", err);
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Avatar colour (deterministic) ───────────────────────────
    const avatarColor = (phone) => {
        const n = parseInt((phone || '').replace(/\D/g, ''), 10) || 0;
        return n % 5;
    };

    const initials = (name) =>
        (name || 'U')
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0] || '')
            .join('')
            .toUpperCase() || 'U';

    return (
        <div className="aem-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="aem-card" role="dialog" aria-modal="true" aria-labelledby="aem-title">

                {/* ── Header ── */}
                <div className="aem-header">
                    <div className="aem-header-text">
                        <h2 id="aem-title" className="aem-title">Assign Exam</h2>
                        <p className="aem-subtitle">
                            Select students who can attempt{' '}
                            <span className="aem-exam-name">"{exam.title || 'this exam'}"</span>
                        </p>
                    </div>
                    <button className="aem-close-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* ── Search ── */}
                <div className="aem-search-wrap">
                    <svg className="aem-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        ref={searchRef}
                        className="aem-search-input"
                        type="text"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* ── List header: Select All + count ── */}
                <div className="aem-list-header">
                    <input
                        className="aem-checkbox"
                        type="checkbox"
                        id="aem-select-all"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked; }}
                        onChange={handleSelectAll}
                        disabled={filtered.length === 0}
                    />
                    <label className="aem-select-all-label" htmlFor="aem-select-all">
                        {search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'All Students'}
                    </label>
                    <div className="aem-count-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {selected.size} selected
                    </div>
                </div>

                {/* ── Student list ── */}
                <div className="aem-list">
                    {filtered.length === 0 ? (
                        <div className="aem-empty-msg">
                            <span className="aem-empty-icon">🔍</span>
                            No students match your search.
                        </div>
                    ) : (
                        filtered.map((student) => {
                            const studentPhone = student.mobilePhone || student.mobile_phone || student.id;
                            const isSelected = selected.has(studentPhone);
                            const sId = student.id || student._id || studentPhone;
                            return (
                                <div
                                    key={sId}
                                    className={`aem-student-row${isSelected ? ' aem-selected' : ''}`}
                                    onClick={() => handleToggle(studentPhone)}
                                >
                                    <input
                                        className="aem-checkbox"
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggle(studentPhone)}
                                        onClick={(e) => e.stopPropagation()}
                                        id={`aem-s-${sId}`}
                                    />
                                    <div
                                        className="aem-avatar"
                                        data-color={avatarColor(studentPhone)}
                                    >
                                        {initials(student.name || student.firstName)}
                                    </div>
                                    <div className="aem-student-info">
                                        <div className="aem-student-name">{student.name || `${student.firstName} ${student.lastName}`}</div>
                                        <div className="aem-student-email">{student.email || student.mobilePhone}</div>
                                    </div>
                                    <div className="aem-section-badge">
                                        {student.grade ? `Gr.${student.grade}` : 'Student'} {student.section ? `– ${student.section}` : ''}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="aem-footer">
                    <span className="aem-footer-count">
                        <strong>{selected.size}</strong> student{selected.size !== 1 ? 's' : ''} selected
                    </span>
                    <button className="aem-cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="aem-assign-btn"
                        onClick={handleAssign}
                        disabled={selected.size === 0 || isSaving}
                    >
                        {isSaving ? 'Saving...' : '✓ Assign Exam'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignExamModal;
