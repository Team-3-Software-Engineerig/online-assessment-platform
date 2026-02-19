import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Register.css'; // Reuse registration styles

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        mobilePhone: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const data = await authService.login(formData.mobilePhone, formData.password);

            // authService.login already stores token, userData, and userRole in localStorage
            if (data.role === 'admin' || data.role === 'teacher') {
                navigate('/teacher/dashboard');
            } else if (data.role === 'manager') {
                navigate('/manager/dashboard');
            } else {
                navigate('/instructions');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-layout">
            <div className="registration-container">
                <div className="left-decorative">
                    <div className="left-circle-1" />
                    <div className="left-circle-2" />
                    <div className="left-dot-1" />
                    <div className="left-line-1" />
                </div>
                <div className="registration-card">
                    <div className="registration-header">
                        <h1>Welcome Back</h1>
                        <p className="subtitle">Login to your assessment account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="registration-form">
                        <div className="form-group">
                            <label className="form-label">Mobile Phone</label>
                            <input
                                type="tel"
                                name="mobilePhone"
                                value={formData.mobilePhone}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Enter mobile phone number"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Logging in...' : 'Login'}
                        </button>

                        <p className="form-note">
                            Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/select-role')}>Register here</span>
                        </p>
                    </form>
                </div>
            </div>
            <div className="registration-info-panel">
                <div className="info-content">
                    <h1 className="info-title">Secure Access</h1>
                    <p className="info-text">Access your dashboard to manage exams, view student progress, and analyze results.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
