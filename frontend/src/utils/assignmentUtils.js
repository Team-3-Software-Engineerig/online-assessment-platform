/**
 * assignmentUtils.js
 * ──────────────────────────────────────────────────────────
 * All assignment + student localStorage helpers.
 * No React dependency — pure JS.
 */

// ── localStorage keys ───────────────────────────────────────
const STUDENTS_KEY = 'students';
const ASSIGNMENTS_KEY = 'examAssignments';

// ── 20 realistic seed students ──────────────────────────────
const SEED_STUDENTS = [
    { id: 's1', name: 'Aisha Bekova', email: 'aisha.bekova@ucaschool.edu', grade: '9', section: 'A' },
    { id: 's2', name: 'Timur Dzhaksybekov', email: 'timur.dzhak@ucaschool.edu', grade: '9', section: 'A' },
    { id: 's3', name: 'Malika Umarova', email: 'malika.umarova@ucaschool.edu', grade: '9', section: 'A' },
    { id: 's4', name: 'Ruslan Mamytov', email: 'ruslan.mamytov@ucaschool.edu', grade: '9', section: 'B' },
    { id: 's5', name: 'Zarina Askarova', email: 'zarina.askarova@ucaschool.edu', grade: '9', section: 'B' },
    { id: 's6', name: 'Arman Seitkali', email: 'arman.seitkali@ucaschool.edu', grade: '9', section: 'B' },
    { id: 's7', name: 'Nurgul Akhmetova', email: 'nurgul.akhmetova@ucaschool.edu', grade: '9', section: 'C' },
    { id: 's8', name: 'Damir Tashkenov', email: 'damir.tashkenov@ucaschool.edu', grade: '9', section: 'C' },
    { id: 's9', name: 'Ainur Bayzhanova', email: 'ainur.bayzhanova@ucaschool.edu', grade: '9', section: 'C' },
    { id: 's10', name: 'Bekzod Yusupov', email: 'bekzod.yusupov@ucaschool.edu', grade: '9', section: 'D' },
    { id: 's11', name: 'Madina Sultanova', email: 'madina.sultanova@ucaschool.edu', grade: '9', section: 'D' },
    { id: 's12', name: 'Azamat Duisenbayev', email: 'azamat.duisen@ucaschool.edu', grade: '9', section: 'D' },
    { id: 's13', name: 'Gulsanam Nazarova', email: 'gulsanam.nazarova@ucaschool.edu', grade: '9', section: 'A' },
    { id: 's14', name: 'Eldar Nurmagambetov', email: 'eldar.nurm@ucaschool.edu', grade: '9', section: 'B' },
    { id: 's15', name: 'Kamila Abdullayeva', email: 'kamila.abdullayeva@ucaschool.edu', grade: '9', section: 'C' },
    { id: 's16', name: 'Yerlan Seidaliyev', email: 'yerlan.seidali@ucaschool.edu', grade: '9', section: 'A' },
    { id: 's17', name: 'Dilnoza Mirzayeva', email: 'dilnoza.mirzayeva@ucaschool.edu', grade: '9', section: 'B' },
    { id: 's18', name: 'Rustam Karimov', email: 'rustam.karimov@ucaschool.edu', grade: '9', section: 'C' },
    { id: 's19', name: 'Zhuldyz Kanatova', email: 'zhuldyz.kanatova@ucaschool.edu', grade: '9', section: 'D' },
    { id: 's20', name: 'Adilet Osmonov', email: 'adilet.osmonov@ucaschool.edu', grade: '9', section: 'A' },
];

/**
 * Write 20 seed students to localStorage on first run.
 * Safe to call on every mount — no-op if data already exists.
 */
export function seedStudentsIfMissing() {
    try {
        if (!localStorage.getItem(STUDENTS_KEY)) {
            localStorage.setItem(STUDENTS_KEY, JSON.stringify(SEED_STUDENTS));
        }
    } catch { /* localStorage blocked — non-critical */ }
}

/**
 * @returns {Array<{id,name,email,grade,section}>} all students
 */
export function loadStudents() {
    try {
        return JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
    } catch { return []; }
}

/**
 * @returns {{ [examId: string]: string[] }} map of examId → array of studentIds
 */
export function loadAssignments() {
    try {
        return JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '{}');
    } catch { return {}; }
}

/**
 * @param {{ [examId: string]: string[] }} map
 */
export function saveAssignments(map) {
    try {
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(map));
    } catch { /* non-critical */ }
}

/**
 * Check whether a specific student is assigned to an exam.
 * @param {string|number} examId
 * @param {string}        studentId
 * @returns {boolean}
 */
export function isExamAssignedToStudent(examId, studentId) {
    if (examId == null || !studentId) return false;
    const assignments = loadAssignments();
    const ids = assignments[String(examId)] || [];
    return ids.includes(String(studentId));
}

/**
 * Return the effective student identifier from localStorage 'studentData'.
 * Prefers .id, falls back to .email.
 * @returns {string|null}
 */
export function getStudentId() {
    try {
        const data = JSON.parse(localStorage.getItem('studentData') || '{}');
        return String(data.id || data.email || '') || null;
    } catch { return null; }
}

/**
 * Get the list of exam IDs assigned to a student.
 * @param {string} studentId
 * @returns {string[]}
 */
export function getAssignedExamIds(studentId) {
    if (!studentId) return [];
    const map = loadAssignments();
    return Object.entries(map)
        .filter(([, ids]) => ids.includes(String(studentId)))
        .map(([examId]) => examId);
}
