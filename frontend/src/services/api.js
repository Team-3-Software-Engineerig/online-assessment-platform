// Base API URL - use proxy in dev, or full URL from env
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper for all API requests to handle cloning and robust error messages
async function apiRequest(url, options = {}) {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = userData.access_token || localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const responseClone = response.clone();

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      const text = await responseClone.text();
      // If the body is empty or invalid JSON, return the raw text or error
      if (!response.ok) {
        throw new Error(`Server error: ${text || response.statusText || 'Invalid response'}`);
      }
      return { success: true, data: text }; // Fallback for non-JSON success
    }

    if (!response.ok) {
      let message = 'Request failed';
      if (typeof responseData?.detail === 'string') {
        message = responseData.detail;
      } else if (Array.isArray(responseData?.detail)) {
        // FastAPI validation errors are often a list of objects
        message = responseData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
      } else if (responseData?.message) {
        message = responseData.message;
      } else {
        message = `Request failed (${response.status})`;
      }
      throw new Error(message);
    }

    return { success: true, data: responseData, message: responseData?.message };
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('connect')) {
      throw new Error('Cannot connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
}

// Helper to normalize phone numbers (digits and optional leading + only)
function normalizePhone(phone) {
  if (!phone) return phone;
  const cleaned = phone.toString().replace(/[^\d+]/g, '');
  // Ensure it doesn't have multiple + or + in the middle
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.substring(1).replace(/\+/g, '');
  }
  return cleaned.replace(/\+/g, '');
}

// Auth-related
export async function login(mobilePhone, password) {
  const apiUrl = `${API_BASE_URL}/api/auth/login`;
  return apiRequest(apiUrl, {
    method: 'POST',
    body: JSON.stringify({
      mobile_phone: normalizePhone(mobilePhone),
      password
    })
  });
}

// Question management
export async function createQuestion(payload) {
  const apiUrl = `${API_BASE_URL}/api/questions`;
  return apiRequest(apiUrl, { method: 'POST', body: JSON.stringify(payload) });
}

// Exam management
export async function createExam(payload) {
  const apiUrl = `${API_BASE_URL}/api/admin/exams/create`;
  const normalizedPayload = { ...payload };
  if (Array.isArray(normalizedPayload.assigned_students)) {
    normalizedPayload.assigned_students = normalizedPayload.assigned_students.map(normalizePhone);
  }
  return apiRequest(apiUrl, { method: 'POST', body: JSON.stringify(normalizedPayload) });
}

export async function getExams() {
  const apiUrl = `${API_BASE_URL}/api/admin/exams`;
  return apiRequest(apiUrl, { method: 'GET' });
}

export async function getActiveExams() {
  const apiUrl = `${API_BASE_URL}/api/exams/active`;
  return apiRequest(apiUrl, { method: 'GET' });
}

export async function getExamDetails(examId) {
  const apiUrl = `${API_BASE_URL}/api/exams/${examId}`;
  return apiRequest(apiUrl, { method: 'GET' });
}

export async function getQuestionsForExam(examId) {
  const apiUrl = `${API_BASE_URL}/api/exams/${examId}/questions`;
  return apiRequest(apiUrl, { method: 'GET' });
}

// User management
export async function getStudents() {
  const apiUrl = `${API_BASE_URL}/api/admin/students`;
  return apiRequest(apiUrl, { method: 'GET' });
}

export async function getTeachers() {
  const apiUrl = `${API_BASE_URL}/api/admin/teachers`;
  return apiRequest(apiUrl, { method: 'GET' });
}

export async function getManagers() {
  const apiUrl = `${API_BASE_URL}/api/admin/managers`;
  return apiRequest(apiUrl, { method: 'GET' });
}

export async function adminCreateUser(payload) {
  const apiUrl = `${API_BASE_URL}/api/admin/users/create`;
  const normalizedPayload = { ...payload };
  if (normalizedPayload.mobilePhone) {
    normalizedPayload.mobilePhone = normalizePhone(normalizedPayload.mobilePhone);
  }
  if (normalizedPayload.mobile_phone) {
    normalizedPayload.mobile_phone = normalizePhone(normalizedPayload.mobile_phone);
  }
  return apiRequest(apiUrl, { method: 'POST', body: JSON.stringify(normalizedPayload) });
}

export async function registerUser(payload) {
  const apiUrl = `${API_BASE_URL}/api/register`;
  const normalizedPayload = { ...payload };
  if (normalizedPayload.mobilePhone) {
    normalizedPayload.mobilePhone = normalizePhone(normalizedPayload.mobilePhone);
  }
  if (normalizedPayload.mobile_phone) {
    normalizedPayload.mobile_phone = normalizePhone(normalizedPayload.mobile_phone);
  }
  return apiRequest(apiUrl, { method: 'POST', body: JSON.stringify(normalizedPayload) });
}

// Legacy export for Register.jsx
export async function registerStudent(payload) {
  return registerUser({ ...payload, role: 'student' });
}

export async function assignExam(examId, assignedStudents) {
  const apiUrl = `${API_BASE_URL}/api/admin/exams/${examId}/assignments`;
  const normalizedStudents = Array.isArray(assignedStudents)
    ? assignedStudents.map(normalizePhone)
    : assignedStudents;
  return apiRequest(apiUrl, {
    method: 'PUT',
    body: JSON.stringify({ assigned_students: normalizedStudents })
  });
}

// Exam Session management
export async function startExamSession(studentId, examId) {
  const apiUrl = `${API_BASE_URL}/api/exams/start-session`;
  return apiRequest(apiUrl, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, exam_id: examId })
  });
}

export async function submitAnswer(sessionToken, questionId, answerText) {
  const apiUrl = `${API_BASE_URL}/api/exams/submit-answer`;
  return apiRequest(apiUrl, {
    method: 'POST',
    body: JSON.stringify({ session_token: sessionToken, question_id: questionId, answer_text: answerText })
  });
}

// Legacy export for backward compatibility
export async function submitExamAnswer(sessionToken, questionId, answerText) {
  return submitAnswer(sessionToken, questionId, answerText);
}

export async function completeExamSession(sessionToken) {
  const apiUrl = `${API_BASE_URL}/api/exams/complete-session`;
  return apiRequest(apiUrl, {
    method: 'POST',
    body: JSON.stringify({ session_token: sessionToken })
  });
}

// Results and Reports
export async function getExamReport(sessionTokenOrId) {
  const apiUrl = `${API_BASE_URL}/api/reports/session/${sessionTokenOrId}`;
  return apiRequest(apiUrl, { method: 'GET' });
}

export async function getStudentReports(studentId) {
  const apiUrl = `${API_BASE_URL}/api/reports/student/${studentId}`;
  return apiRequest(apiUrl, { method: 'GET' });
}
