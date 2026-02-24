/**
 * teacherExamPdf.js
 * ─────────────────────────────────────────────────────────
 * Generates a clean, professional printable exam-paper PDF
 * for teachers. Correct answers, scores, and student data
 * are NEVER included.
 *
 * Usage:
 *   import { generateTeacherExamPdf } from '../utils/teacherExamPdf';
 *   generateTeacherExamPdf({ title, subject, duration, questions, ... });
 */

import jsPDF from 'jspdf';

// ── Configurable platform name ─────────────────────────────
const PLATFORM_NAME =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PLATFORM_NAME) ||
    'Online Assessment Platform';

// ── Layout constants (all in mm, A4) ──────────────────────
const PW = 210;       // page width
const PH = 297;       // page height
const ML = 20;        // margin left
const MR = 190;       // margin right  (PW - 20)
const CW = MR - ML;  // content width  = 170
const FOOTER_H = 18; // reserved for footer at bottom

// ── Colour palette ─────────────────────────────────────────
const C = {
    primary: [41, 65, 148],   // deep indigo
    accent: [16, 185, 129],   // emerald green
    text: [30, 41, 59],    // near-black
    muted: [100, 116, 139],   // slate-500
    border: [226, 232, 240],   // slate-200
    light: [248, 250, 252],   // slate-50
    white: [255, 255, 255],
};

// ── Small helpers ──────────────────────────────────────────
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function fmtTime(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch { return null; }
}

function fmtDuration(minutes) {
    const m = Math.round(Number(minutes));
    if (!m || isNaN(m)) return null;
    if (m >= 60 && m % 60 === 0) return `${m / 60} Hour${m / 60 > 1 ? 's' : ''}`;
    if (m >= 60) return `${Math.floor(m / 60)} Hr ${m % 60} Min`;
    return `${m} Minutes`;
}

function fmtDate(iso) {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function safeName(str) {
    return (str || 'Untitled')
        .replace(/[^a-z0-9\s]/gi, '')
        .trim()
        .replace(/\s+/g, '_');
}

// ── Footer renderer (called after all content is placed) ───
function addFooters(doc, platformName) {
    const total = doc.getNumberOfPages();
    const ts = new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    for (let i = 1; i <= total; i++) {
        doc.setPage(i);

        // Thin rule
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.line(ML, PH - 13, MR, PH - 13);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);

        doc.text(platformName, ML, PH - 8);
        doc.text(`Page ${i} of ${total}`, PW / 2, PH - 8, { align: 'center' });
        doc.text(`Generated: ${ts}`, MR, PH - 8, { align: 'right' });
    }
}

// ══════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════
/**
 * @param {Object} examData
 * @param {string} examData.title          - Exam title
 * @param {string} examData.subject        - Subject name
 * @param {number} [examData.duration]     - Duration in minutes
 * @param {string} [examData.startTime]    - ISO datetime or "HH:MM AM/PM"
 * @param {string} [examData.endTime]      - ISO datetime or "HH:MM AM/PM"
 * @param {string} [examData.teacherName]  - Teacher full name
 * @param {string} [examData.examId]       - Exam code / ID
 * @param {string} [examData.createdAt]    - ISO date string
 * @param {Array}  examData.questions      - Array of question objects
 *   Each question: { questionText, options: [{ text }] }
 *   NOTE: isCorrect / correctAnswer fields are intentionally IGNORED.
 */
export function generateTeacherExamPdf(examData) {
    const {
        title = 'Untitled Exam',
        subject = '',
        duration,
        startTime,
        endTime,
        teacherName,
        examId,
        createdAt,
        questions = [],
    } = examData;

    const platformName = PLATFORM_NAME;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // bottom safe limit before footer zone
    const MAX_Y = PH - FOOTER_H - 8;

    let y = 0; // cursor

    // ══════════════════════════════════════════════════════
    // PAGE 1 — HEADER
    // ══════════════════════════════════════════════════════

    // ── Accent bar ─────────────────────────────────────────
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, PW, 30, 'F');

    // Platform name (inside bar, small)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.white);
    doc.setGState(doc.GState({ opacity: 0.75 }));
    doc.text(platformName, ML, 8);
    doc.setGState(doc.GState({ opacity: 1 }));

    // Grade badge
    doc.setFillColor(...C.accent);
    doc.roundedRect(PW - ML - 28, 5, 28, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text('GRADE  9', PW - ML - 14, 11.5, { align: 'center' });

    // Exam Title (inside bar)
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    const titleLines = doc.splitTextToSize(title, PW - ML - 40);
    doc.text(titleLines, ML, 21);

    y = 38;

    // ── Info grid ──────────────────────────────────────────
    // Calculate duration string
    let durationStr = '—';
    if (startTime && endTime) {
        try {
            const ms = new Date(endTime) - new Date(startTime);
            durationStr = fmtDuration(ms / 60000) || '—';
        } catch { /* fall through */ }
    }
    if (durationStr === '—' && duration) {
        durationStr = fmtDuration(duration) || '—';
    }

    const autoExamId = examId || `EX-${Date.now().toString().slice(-6)}`;

    const leftInfo = [
        ['Subject', subject || '—'],
        ['Teacher', teacherName || '—'],
        ['Exam Code', autoExamId],
        ['Date', fmtDate(createdAt)],
    ];

    const rightInfo = [
        ['Start Time', fmtTime(startTime) || '—'],
        ['End Time', fmtTime(endTime) || '—'],
        ['Duration', durationStr],
    ];

    const BOX_H = 50;
    doc.setFillColor(...C.light);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, CW, BOX_H, 2, 2, 'FD');

    const col1X = ML + 5;
    const col2X = PW / 2 + 5;
    let infoY = y + 10;

    leftInfo.forEach(([label, val]) => {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);
        doc.text(label + ':', col1X, infoY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.text);
        doc.text(String(val), col1X + 24, infoY);
        infoY += 10.5;
    });

    infoY = y + 10;
    rightInfo.forEach(([label, val]) => {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);
        doc.text(label + ':', col2X, infoY);
        const valColor = label === 'Duration' ? C.primary : C.text;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...valColor);
        doc.text(String(val), col2X + 26, infoY);
        infoY += 10.5;
    });

    y += BOX_H + 10;

    // ══════════════════════════════════════════════════════
    // INSTRUCTIONS
    // ══════════════════════════════════════════════════════
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text('INSTRUCTIONS', ML, y);
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.6);
    doc.line(ML, y + 2, ML + 42, y + 2);
    y += 9;

    const INSTR = [
        'Read each question carefully before answering.',
        'Attempt all questions. Do not leave any question blank.',
        'For MCQ questions, select ONE option only (A, B, C, or D).',
        'Write clearly and legibly for any short-answer questions.',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.text);

    INSTR.forEach((ins) => {
        const lines = doc.splitTextToSize(ins, CW - 10);
        doc.text('•', ML + 3, y);
        doc.text(lines, ML + 9, y);
        y += lines.length * 5.5 + 2;
    });

    y += 5;

    // Section divider
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, y, MR, y);
    y += 9;

    // ══════════════════════════════════════════════════════
    // QUESTIONS SECTION LABEL
    // ══════════════════════════════════════════════════════
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(`QUESTIONS  (${questions.length} Total)`, ML, y);
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.6);
    doc.line(ML, y + 2, ML + 58, y + 2);
    y += 10;

    // ══════════════════════════════════════════════════════
    // QUESTIONS LOOP
    // ══════════════════════════════════════════════════════
    questions.forEach((q, idx) => {
        // ── Estimate block height for page-break decision ──
        const qTextStr = q.questionText || '';
        const qLines = doc.splitTextToSize(qTextStr, CW - 12);
        const optCount = (q.options || []).length;
        const estH = qLines.length * 5.5 + optCount * 10 + 18;

        if (y + estH > MAX_Y) {
            doc.addPage();
            y = 22;
        }

        // ── Question number circle badge ───────────────────
        doc.setFillColor(...C.primary);
        doc.circle(ML + 4, y - 1, 4, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.white);
        doc.text(String(idx + 1), ML + 4, y + 0.8, { align: 'center' });

        // ── Question text ──────────────────────────────────
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.text);
        doc.text(qLines, ML + 11, y);
        y += qLines.length * 5.5 + 5;

        // ── Options ───────────────────────────────────────
        //    Correct-answer info is deliberately NOT rendered
        const opts = (q.options || []);
        opts.forEach((opt, oi) => {
            if (y + 11 > MAX_Y) {
                doc.addPage();
                y = 22;
            }

            const letter = LETTERS[oi] || String(oi + 1);
            const optText = opt.text || '';
            const optLines = doc.splitTextToSize(optText, CW - 24);
            const rowH = Math.max(optLines.length * 5 + 5, 10);

            // Row background
            doc.setFillColor(...C.light);
            doc.setDrawColor(...C.border);
            doc.setLineWidth(0.2);
            doc.roundedRect(ML + 8, y - 4.5, CW - 8, rowH, 1.5, 1.5, 'FD');

            // Letter badge (slate)
            doc.setFillColor(...C.muted);
            doc.roundedRect(ML + 10, y - 3.5, 7.5, 7, 1, 1, 'F');
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.white);
            doc.text(letter, ML + 13.8, y + 0.8, { align: 'center' });

            // Option text
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.text);
            doc.text(optLines, ML + 21, y);

            y += rowH + 2;
        });

        y += 7; // gap after each question
    });

    // ══════════════════════════════════════════════════════
    // FOOTER — every page
    // ══════════════════════════════════════════════════════
    addFooters(doc, platformName);

    // ══════════════════════════════════════════════════════
    // SAVE
    // ══════════════════════════════════════════════════════
    const dateSlug = new Date().toISOString().slice(0, 10);
    const filename = [
        safeName(platformName),
        safeName(subject),
        'Grade9',
        safeName(title),
        dateSlug,
    ].join('_') + '.pdf';

    doc.save(filename);
}
