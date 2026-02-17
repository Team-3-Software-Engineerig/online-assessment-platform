export async function registerStudent(payload) {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.detail || 'Registration failed';
      const errors = errorBody?.errors || {};
      throw Object.assign(new Error(message), { errors });
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      data,
      message: data?.message || 'Registered successfully',
    };
  } catch (error) {
    if (!error.success) {
      return Promise.reject(error);
    }
    throw error;
  }
}

