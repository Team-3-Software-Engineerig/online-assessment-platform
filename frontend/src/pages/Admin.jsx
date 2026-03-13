import React, { useEffect, useState } from 'react';
import { registerUser, getStudents, getTeachers, adminCreateUser, getManagers } from '../services/api';
import './Register.css';

const Admin = () => {
  const [dashboardTitle, setDashboardTitle] = useState('Dashboard');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log("Admin Dashboard - Current Role:", user.role);
        setUserRole(user.role);
        setDashboardTitle(user.role === 'admin' ? 'Administrator Shield' : 'Manager Dashboard');
      } catch (err) {
        // ignore
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const role = userData.role;

      if (role === 'admin') {
        const mRes = await getManagers();
        if (mRes.success) setManagers(mRes.data);
      }
      const sRes = await getStudents();
      if (sRes.success) setStudents(sRes.data);
      const tRes = await getTeachers();
      if (tRes.success) setTeachers(tRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  const [managerForm, setManagerForm] = useState({ firstName: '', lastName: '', mobilePhone: '', password: '' });
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', mobilePhone: '' });
  const [teacherForm, setTeacherForm] = useState({ firstName: '', lastName: '', mobilePhone: '', subject: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'teacher'

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

  const handleManagerChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobilePhone') {
      setManagerForm((p) => ({ ...p, mobilePhone: formatPhoneNumber(value) }));
    } else {
      setManagerForm((p) => ({ ...p, [name]: value }));
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

  const handleAddManager = async (e) => {
    e.preventDefault();
    const newErrors = validate(managerForm, 'manager');
    if (!managerForm.password || managerForm.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await adminCreateUser({
        ...managerForm,
        role: 'manager',
      });
      if (res.success && res.data) {
        setManagers((m) => [res.data, ...m]);
        setManagerForm({ firstName: '', lastName: '', mobilePhone: '', password: '' });
        setSuccessMsg('Manager added successfully');
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to add manager' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(''), 2500);
    }
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
      const res = await adminCreateUser({
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
      const res = await adminCreateUser({
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
            <h1>{dashboardTitle}</h1>
            <p className="subtitle">Welcome to the central command center.</p>
          </div>

          {userRole === 'admin' && (
            <div style={{ padding: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <h3 style={{ marginBottom: 15, color: 'var(--primary)' }}>Create New Manager</h3>
              <p style={{ marginBottom: 20, fontSize: '0.9rem', opacity: 0.8 }}>Administrators can only create managers. Managers will then handle student and teacher assignments.</p>
              <form onSubmit={handleAddManager} className="registration-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }} noValidate>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input name="firstName" value={managerForm.firstName} onChange={handleManagerChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input name="lastName" value={managerForm.lastName} onChange={handleManagerChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input name="mobilePhone" value={managerForm.mobilePhone} onChange={handleManagerChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" value={managerForm.password} onChange={handleManagerChange} className="form-input" />
                </div>
                <button type="submit" className="submit-button" disabled={isSubmitting} style={{ gridColumn: 'span 2' }}>
                  {isSubmitting ? 'Creating...' : 'Register Manager'}
                </button>
              </form>

              {managers.length > 0 && (
                <div style={{ marginTop: 25 }}>
                  <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>Active Managers</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15 }}>
                    {managers.map(m => (
                      <div key={m.id} style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 15px', borderRadius: 8 }}>
                        <div style={{ fontWeight: '600' }}>{m.firstName} {m.lastName}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{m.mobilePhone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {userRole === 'manager' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 25, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 15 }}>
                <button
                  onClick={() => { setActiveTab('student'); setErrors({}); }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 20,
                    border: 'none',
                    background: activeTab === 'student' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    color: activeTab === 'student' ? 'white' : 'inherit',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s'
                  }}
                >
                  Manage Students
                </button>
                <button
                  onClick={() => { setActiveTab('teacher'); setErrors({}); }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 20,
                    border: 'none',
                    background: activeTab === 'teacher' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    color: activeTab === 'teacher' ? 'white' : 'inherit',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s'
                  }}
                >
                  Manage Teachers
                </button>
              </div>

              {activeTab === 'student' ? (
                <div className="tab-fade-in">
                  <h3 style={{ marginBottom: 15, color: 'var(--primary)' }}>Add New Student</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 20 }}>Enter student details to assign them to the system. They can then self-register using their phone number.</p>
                  <form onSubmit={handleAddStudent} className="registration-form" noValidate>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                      <div className="form-group">
                        <label className="form-label">First Name <span className="required">*</span></label>
                        <input name="firstName" value={studentForm.firstName} onChange={handleStudentChange} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="First Name" />
                        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name <span className="required">*</span></label>
                        <input name="lastName" value={studentForm.lastName} onChange={handleStudentChange} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Last Name" />
                        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Phone <span className="required">*</span></label>
                      <input name="mobilePhone" value={studentForm.mobilePhone} onChange={handleStudentChange} className={`form-input ${errors.mobilePhone ? 'error' : ''}`} placeholder="(123) 456-7890" maxLength={14} />
                      {errors.mobilePhone && <span className="error-message">{errors.mobilePhone}</span>}
                    </div>
                    {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
                    <button type="submit" className="submit-button" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Assign Student'}</button>
                  </form>

                  {students.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                      <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginBottom: 12 }}>Assigned Students</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {students.map((s) => (
                          <div key={s.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: 8 }}>
                            <div style={{ fontWeight: '600' }}>{s.firstName} {s.lastName}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{s.mobilePhone}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="tab-fade-in">
                  <h3 style={{ marginBottom: 15, color: 'var(--primary)' }}>Add New Teacher</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 20 }}>Register a teacher and assign their subject. They can then log in or self-register via phone.</p>
                  <form onSubmit={handleAddTeacher} className="registration-form" noValidate>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                      <div className="form-group">
                        <label className="form-label">First Name <span className="required">*</span></label>
                        <input name="firstName" value={teacherForm.firstName} onChange={handleTeacherChange} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="First Name" />
                        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name <span className="required">*</span></label>
                        <input name="lastName" value={teacherForm.lastName} onChange={handleTeacherChange} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Last Name" />
                        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                      <div className="form-group">
                        <label className="form-label">Mobile Phone <span className="required">*</span></label>
                        <input name="mobilePhone" value={teacherForm.mobilePhone} onChange={handleTeacherChange} className={`form-input ${errors.mobilePhone ? 'error' : ''}`} placeholder="Phone" maxLength={14} />
                        {errors.mobilePhone && <span className="error-message">{errors.mobilePhone}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject <span className="required">*</span></label>
                        <input name="subject" value={teacherForm.subject} onChange={handleTeacherChange} className={`form-input ${errors.subject ? 'error' : ''}`} placeholder="e.g. Math" />
                        {errors.subject && <span className="error-message">{errors.subject}</span>}
                      </div>
                    </div>
                    {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
                    <button type="submit" className="submit-button" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Assign Teacher'}</button>
                  </form>

                  {teachers.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                      <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginBottom: 12 }}>Assigned Teachers</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {teachers.map((t) => (
                          <div key={t.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: 8 }}>
                            <div style={{ fontWeight: '600' }}>{t.firstName} {t.lastName}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t.mobilePhone} • {t.subject}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
