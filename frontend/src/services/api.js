// Base API URL - use proxy in dev, or full URL from env
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Mock mode - set to false when backend is ready
const USE_MOCK_API = true;

// Create a new MCQ question
export async function createQuestion(payload) {
  try {
    // MOCK MODE: Simulate successful creation without backend
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockQuestion = {
        id: Date.now(),
        questionText: payload.questionText,
        options: payload.options,
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: mockQuestion,
        message: 'Question created successfully!',
      };
    }

    // REAL API CALL (set USE_MOCK_API to false when backend is ready)
    const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/questions` : '/api/questions';

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      const text = await response.text();
      throw new Error(`Server error: ${text || 'Invalid response from server'}`);
    }

    if (!response.ok) {
      const message = responseData?.detail || responseData?.message || `Failed to create question (${response.status})`;
      throw new Error(message);
    }

    return {
      success: true,
      data: responseData,
      message: responseData?.message || 'Question created successfully!',
    };
  } catch (error) {
    if (error.message.includes('Cannot connect') || error.message.includes('Server error')) {
      throw error;
    }
    throw new Error(error.message || 'An unexpected error occurred. Please try again.');
  }
}

// Create a full exam with multiple questions
export async function createExam(payload) {
  try {
    // MOCK MODE: Simulate successful creation without backend
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 700));

      const savedExam = {
        id: Date.now(),
        title: payload.title,
        subject: payload.subject,
        duration: payload.duration,
        total_questions: payload.questions.length,
        status: 'Active',
        created_at: new Date().toISOString(),
      };

      // Persist to localStorage so the dashboard can show it
      try {
        const existing = JSON.parse(localStorage.getItem('teacher_created_exams') || '[]');
        localStorage.setItem('teacher_created_exams', JSON.stringify([savedExam, ...existing]));
      } catch (_) { /* localStorage blocked - non-critical */ }

      return {
        success: true,
        data: savedExam,
        message: `Exam "${payload.title}" created with ${payload.questions.length} question${payload.questions.length !== 1 ? 's' : ''}!`,
      };
    }

    // REAL API CALL (set USE_MOCK_API to false when backend is ready)
    const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/exams` : '/api/exams';

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      const text = await response.text();
      throw new Error(`Server error: ${text || 'Invalid response from server'}`);
    }

    if (!response.ok) {
      const message = responseData?.detail || responseData?.message || `Failed to create exam (${response.status})`;
      throw new Error(message);
    }

    return {
      success: true,
      data: responseData,
      message: responseData?.message || 'Exam created successfully!',
    };
  } catch (error) {
    if (error.message.includes('Cannot connect') || error.message.includes('Server error')) {
      throw error;
    }
    throw new Error(error.message || 'An unexpected error occurred. Please try again.');
  }
}

// Generic registration function for all user roles
export async function registerUser(payload) {
  try {
    // Clean phone number - send only digits
    const cleanPayload = {
      ...payload,
      mobilePhone: payload.mobilePhone.replace(/\D/g, ''),
    };

    // MOCK MODE: Simulate successful registration without backend
    if (USE_MOCK_API) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate mock user ID
      const mockId = Date.now();

      const mockResponse = {
        id: mockId,
        firstName: cleanPayload.firstName,
        lastName: cleanPayload.lastName,
        mobilePhone: cleanPayload.mobilePhone,
        role: cleanPayload.role || 'student',
        message: 'Registration successful'
      };

      return {
        success: true,
        data: mockResponse,
        message: 'Registered successfully',
      };
    }

    // REAL API CALL (when backend is ready, set USE_MOCK_API to false)
    const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/register` : '/api/register';

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanPayload),
      });
    } catch (fetchError) {
      // Network error - backend might not be running
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      // Response is not JSON
      const text = await response.text();
      throw new Error(`Server error: ${text || 'Invalid response from server'}`);
    }

    if (!response.ok) {
      const message = responseData?.detail || responseData?.message || `Registration failed (${response.status})`;
      const errors = responseData?.errors || {};
      const error = new Error(message);
      error.errors = errors;
      throw error;
    }

    return {
      success: true,
      data: responseData,
      message: responseData?.message || 'Registered successfully',
    };
  } catch (error) {
    // If it's already our custom error, rethrow it
    if (error.errors !== undefined || error.message.includes('Cannot connect') || error.message.includes('Server error')) {
      throw error;
    }
    // Other errors
    throw new Error(error.message || 'An unexpected error occurred. Please try again.');
  }
}

// Legacy function for backward compatibility
export async function registerStudent(payload) {
  return registerUser({ ...payload, role: 'student' });
}

// Get exams for teacher/admin
export async function getExams() {
  try {
    // MOCK MODE: Simulate successful fetch without backend
    if (USE_MOCK_API) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Load teacher-created exams from localStorage (saved by createExam)
      let teacherCreatedExams = [];
      try {
        teacherCreatedExams = JSON.parse(localStorage.getItem('teacher_created_exams') || '[]');
      } catch (_) { /* ignore */ }

      // Default mock exams data
      const mockExams = [
        {
          id: 1,
          title: 'Math Assessment - Chapter 1',
          subject: 'math',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          total_questions: 25,
          status: 'Active',
        },
        {
          id: 2,
          title: 'Math Assessment - Chapter 2',
          subject: 'math',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          total_questions: 20,
          status: 'Draft',
        },
        {
          id: 3,
          title: 'Math Final Exam',
          subject: 'math',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          total_questions: 50,
          status: 'Active',
        },
        {
          id: 4,
          title: 'Math Quiz - Algebra',
          subject: 'math',
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          total_questions: 15,
          status: 'Active',
        },
        {
          id: 5,
          title: 'Math Assessment - Geometry',
          subject: 'math',
          created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          total_questions: 30,
          status: 'Active',
        },
      ];

      // Prepend teacher-created exams so they appear at the top of the dashboard
      return {
        success: true,
        data: [...teacherCreatedExams, ...mockExams],
        message: 'Exams fetched successfully',
      };
    }

    // REAL API CALL (when backend is ready, set USE_MOCK_API to false)
    const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/admin/exams` : '/api/admin/exams';

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      // Network error - backend might not be running
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      // Response is not JSON
      const text = await response.text();
      throw new Error(`Server error: ${text || 'Invalid response from server'}`);
    }

    if (!response.ok) {
      const message = responseData?.detail || responseData?.message || `Failed to fetch exams (${response.status})`;
      const error = new Error(message);
      throw error;
    }

    return {
      success: true,
      data: responseData,
      message: 'Exams fetched successfully',
    };
  } catch (error) {
    // If it's already our custom error, rethrow it
    if (error.message.includes('Cannot connect') || error.message.includes('Server error')) {
      throw error;
    }
    // Other errors
    throw new Error(error.message || 'An unexpected error occurred. Please try again.');
  }
}
