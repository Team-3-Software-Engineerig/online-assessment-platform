const API_BASE_URL = '/api';

export const examService = {
    // Get all active exams
    getActiveExams: async () => {
        const response = await fetch(`${API_BASE_URL}/exams/active`);
        if (!response.ok) throw new Error('Failed to fetch active exams');
        return response.json();
    },

    // Get specific exam details
    getExamById: async (examId) => {
        const response = await fetch(`${API_BASE_URL}/exams/${examId}`);
        if (!response.ok) throw new Error('Failed to fetch exam details');
        return response.json();
    },

    // Get questions for an exam
    getQuestions: async (examId) => {
        const response = await fetch(`${API_BASE_URL}/exams/${examId}/questions`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        return response.json();
    },

    // Start a new exam session
    startSession: async (studentId, examId) => {
        const response = await fetch(`${API_BASE_URL}/exams/sessions/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, exam_id: examId }),
        });
        if (!response.ok) throw new Error('Failed to start session');
        return response.json();
    },

    // Submit an answer (autosave)
    submitAnswer: async (sessionToken, questionId, answerText) => {
        const response = await fetch(`${API_BASE_URL}/exams/sessions/submit-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_token: sessionToken,
                question_id: questionId,
                answer_text: String(answerText),
            }),
        });
        if (!response.ok) throw new Error('Failed to submit answer');
        return response.json();
    },

    // Complete the exam session
    completeSession: async (sessionToken) => {
        const response = await fetch(`${API_BASE_URL}/exams/sessions/complete/${sessionToken}`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to complete session');
        return response.json();
    },

    // Get report for a session
    getReport: async (sessionId) => {
        const response = await fetch(`${API_BASE_URL}/reports/session/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch report');
        return response.json();
    }
};
