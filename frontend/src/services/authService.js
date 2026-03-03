const API_BASE_URL = '/api';

export const authService = {
    login: async (mobilePhone, password) => {
        // Keep leading + for international format, only strip other non-digit chars
        const cleanPhone = mobilePhone.startsWith('+')
            ? '+' + mobilePhone.slice(1).replace(/\D/g, '')
            : mobilePhone.replace(/\D/g, '');

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile_phone: cleanPhone, password: password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();

        // Store token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userData', JSON.stringify({
            id: data.user_id,
            name: data.name || (data.role === 'admin' ? 'Administrator' : 'User'),
            surname: data.surname || '',
            role: data.role
        }));
        localStorage.setItem('userRole', data.role);

        return data;
    },

    getCurrentUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            return null;
        }

        return response.json();
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
    }
};
