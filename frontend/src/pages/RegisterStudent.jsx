import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import './Register.css';

const RegisterStudent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobilePhone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First Name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last Name must be at least 2 characters';
    }

    if (!formData.mobilePhone.trim()) {
      newErrors.mobilePhone = 'Mobile Phone Number is required';
    } else {
      const phoneDigits = formData.mobilePhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        newErrors.mobilePhone = 'Please enter a valid mobile phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    }
    if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      mobilePhone: formatted,
    }));
    if (errors.mobilePhone) {
      setErrors((prev) => ({
        ...prev,
        mobilePhone: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await registerUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobilePhone: formData.mobilePhone,
        role: 'student',
      });

      if (response.success && response.data) {
        localStorage.setItem('userData', JSON.stringify(response.data));
        localStorage.setItem('userRole', 'student');
        // Redirect to instructions page on success
        navigate('/instructions');
      } else {
        setErrors({ submit: response.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error?.errors && Object.keys(error.errors).length > 0) {
        setErrors({ ...error.errors, submit: error.message });
      } else {
        setErrors({ submit: error?.message || 'Registration failed. Please try again.' });
      }
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
          <div className="left-dot-2" />
          <div className="left-dot-3" />
          <div className="left-line-1" />
          <div className="left-line-2" />
        </div>
        <div className="registration-card">
          <div className="registration-header">
            <h1>Student Registration</h1>
            <p className="subtitle">
              Register as a student to begin the Math &amp; English assessment
            </p>
          </div>

          <form onSubmit={handleSubmit} className="registration-form" noValidate>
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-input ${errors.firstName ? 'error' : ''}`}
                placeholder="Enter your first name"
                autoComplete="given-name"
                disabled={isSubmitting}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-input ${errors.lastName ? 'error' : ''}`}
                placeholder="Enter your last name"
                autoComplete="family-name"
                disabled={isSubmitting}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mobilePhone" className="form-label">
                Mobile Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="mobilePhone"
                name="mobilePhone"
                value={formData.mobilePhone}
                onChange={handlePhoneChange}
                className={`form-input ${errors.mobilePhone ? 'error' : ''}`}
                placeholder="(123) 456-7890"
                autoComplete="tel"
                maxLength="14"
                disabled={isSubmitting}
              />
              {errors.mobilePhone && <span className="error-message">{errors.mobilePhone}</span>}
            </div>

            {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register & Begin Assessment'}
            </button>

            <p className="form-note">
              <span className="required">*</span> All fields are required
            </p>
          </form>
        </div>
      </div>

      <div className="registration-info-panel">
        <div className="info-visual">
          <div className="illustration-circle-1 illustration-element" />
          <div className="illustration-circle-2 illustration-element" />
          <div className="illustration-circle-3 illustration-element" />
          <div className="illustration-circle-4 illustration-element" />
          <div className="illustration-book" />
          <div className="illustration-plant" />
          <div className="illustration-triangle" />
          <div className="illustration-line illustration-line-1" />
          <div className="illustration-line illustration-line-2" />
          <div className="illustration-dot illustration-dot-1" />
          <div className="illustration-dot illustration-dot-2" />
          <div className="illustration-dot illustration-dot-3" />
          <div className="illustration-dot illustration-dot-4" />
        </div>

        <div className="info-content">
          <div className="info-badge">9th Grade Assessment</div>
          <h1 className="info-title">Math &amp; English Skills Assessment</h1>
          <p className="info-text">
            A placement test to help determine your current skill level and ensure you get the right
            learning support.
          </p>

          <div className="info-points">
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Math and English questions</p>
            </div>
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Timed assessment with progress tracking</p>
            </div>
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>For placement only - not graded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
