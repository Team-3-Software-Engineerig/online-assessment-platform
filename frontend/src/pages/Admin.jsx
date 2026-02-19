import React, { useEffect, useState } from 'react';
import { registerUser } from '../services/api';
import './Register.css';

const Admin = () => {
  const [managerName, setManagerName] = useState('Manager');

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setManagerName(user.firstName || 'Manager');
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', mobilePhone: '' });
  const [teacherForm, setTeacherForm] = useState({ firstName: '', lastName: '', mobilePhone: '', subject: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const formatPhoneNumber = (value) => {
    const phoneNumber = (value || '').replace(/\D/g, '');
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobilePhone') {
      setStudentForm((p) => ({ ...p, mobilePhone: formatPhoneNumber(value) }));
    } else {
      setStudentForm((p) => ({ ...p, [name]: value }));
    }
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleTeacherChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobilePhone') {
      setTeacherForm((p) => ({ ...p, mobilePhone: formatPhoneNumber(value) }));
    } else {
      setTeacherForm((p) => ({ ...p, [name]: value }));
    }
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = (form, type) => {
    const newErrors = {};
    if (!form.firstName || form.firstName.trim().length < 2) newErrors.firstName = 'First Name is required (min 2 chars)';
    if (!form.lastName || form.lastName.trim().length < 2) newErrors.lastName = 'Last Name is required (min 2 chars)';
    if (!form.mobilePhone || form.mobilePhone.replace(/\D/g, '').length < 10) newErrors.mobilePhone = 'Enter a valid phone number';
    if (type === 'teacher' && (!form.subject || form.subject.trim().length < 2)) newErrors.subject = 'Subject is required';
    return newErrors;
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const newErrors = validate(studentForm, 'student');
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await registerUser({
        firstName: studentForm.firstName.trim(),
        lastName: studentForm.lastName.trim(),
        mobilePhone: studentForm.mobilePhone,
        role: 'student',
      });
      if (res.success && res.data) {
        setStudents((s) => [res.data, ...s]);
        setStudentForm({ firstName: '', lastName: '', mobilePhone: '' });
        setSuccessMsg('Student added successfully');
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to add student' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    const newErrors = validate(teacherForm, 'teacher');
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await registerUser({
        firstName: teacherForm.firstName.trim(),
        lastName: teacherForm.lastName.trim(),
        mobilePhone: teacherForm.mobilePhone,
        subject: teacherForm.subject.trim(),
        role: 'teacher',
      });
      if (res.success && res.data) {
        setTeachers((t) => [res.data, ...t]);
        setTeacherForm({ firstName: '', lastName: '', mobilePhone: '', subject: '' });
        setSuccessMsg('Teacher added successfully');
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to add teacher' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(''), 2500);
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

        <div className="registration-card" style={{ maxWidth: '760px' }}>
          <div className="registration-header">
            <h1>Manager Dashboard</h1>
            <p className="subtitle">Hello {managerName}, add students and teachers from here.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h3 style={{ marginBottom: 10 }}>Add Student</h3>
              <form onSubmit={handleAddStudent} className="registration-form" noValidate>
                <div className="form-group">
                  <label className="form-label">First Name <span className="required">*</span></label>
                  <input name="firstName" value={studentForm.firstName} onChange={handleStudentChange} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="Enter first name" />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name <span className="required">*</span></label>
                  <input name="lastName" value={studentForm.lastName} onChange={handleStudentChange} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Enter last name" />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span className="required">*</span></label>
                  <input name="mobilePhone" value={studentForm.mobilePhone} onChange={handleStudentChange} className={`form-input ${errors.mobilePhone ? 'error' : ''}`} placeholder="(123) 456-7890" maxLength={14} />
                  {errors.mobilePhone && <span className="error-message">{errors.mobilePhone}</span>}
                </div>
                {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
                <button type="submit" className="submit-button" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Student'}</button>
              </form>

              {students.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <h4 style={{ margin: '8px 0' }}>Recently added</h4>
                  <ul>
                    {students.map((s) => (
                      <li key={s.id}>{s.firstName} {s.lastName} — {s.mobilePhone}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h3 style={{ marginBottom: 10 }}>Add Teacher</h3>
              <form onSubmit={handleAddTeacher} className="registration-form" noValidate>
                <div className="form-group">
                  <label className="form-label">First Name <span className="required">*</span></label>
                  <input name="firstName" value={teacherForm.firstName} onChange={handleTeacherChange} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="Enter first name" />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name <span className="required">*</span></label>
                  <input name="lastName" value={teacherForm.lastName} onChange={handleTeacherChange} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Enter last name" />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span className="required">*</span></label>
                  <input name="mobilePhone" value={teacherForm.mobilePhone} onChange={handleTeacherChange} className={`form-input ${errors.mobilePhone ? 'error' : ''}`} placeholder="(123) 456-7890" maxLength={14} />
                  {errors.mobilePhone && <span className="error-message">{errors.mobilePhone}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Subject <span className="required">*</span></label>
                  <input name="subject" value={teacherForm.subject} onChange={handleTeacherChange} className={`form-input ${errors.subject ? 'error' : ''}`} placeholder="e.g., Math" />
                  {errors.subject && <span className="error-message">{errors.subject}</span>}
                </div>
                {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
                <button type="submit" className="submit-button" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Teacher'}</button>
              </form>

              {teachers.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <h4 style={{ margin: '8px 0' }}>Recently added</h4>
                  <ul>
                    {teachers.map((t) => (
                      <li key={t.id}>{t.firstName} {t.lastName} — {t.mobilePhone} ({t.subject || '—'})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
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
        </div>

        <div className="info-content">
          <div className="info-badge">Manager Portal</div>
          <h1 className="info-title">Student & Teacher Management</h1>
          <p className="info-text">Add and manage students and teachers quickly. Contact info is kept simple for now.</p>

          <div className="info-points">
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Quickly add students and teachers</p>
            </div>
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Phone numbers formatted consistently</p>
            </div>
            <div className="info-point">
              <span className="info-icon">✓</span>
              <p>Recent additions shown below each form</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
