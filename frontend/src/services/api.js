// Base API URL - use proxy in dev, or full URL from env
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Mock mode - set to false when backend is ready
const USE_MOCK_API = true;

export async function registerStudent(payload) {
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
      
      // Generate mock student ID
      const mockId = Date.now();
      
      const mockResponse = {
        id: mockId,
        firstName: cleanPayload.firstName,
        lastName: cleanPayload.lastName,
        mobilePhone: cleanPayload.mobilePhone,
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

