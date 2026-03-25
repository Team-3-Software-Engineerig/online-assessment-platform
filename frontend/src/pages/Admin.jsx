import React, { useEffect, useState } from 'react';
import {
  getStudents,
  getTeachers,
  adminCreateUser,
  getManagers,
  adminDeleteUser,
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest
} from '../services/api';
import './Register.css';

const Admin = () => {
  const [dashboardTitle, setDashboardTitle] = useState('Dashboard');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const resolvedRole = user.role || localStorage.getItem('userRole') || '';
        console.log("Admin Dashboard - Current Role:", resolvedRole);
        setUserRole(resolvedRole);
        setDashboardTitle(resolvedRole === 'admin' ? 'Administrator Shield' : 'Manager Dashboard');
      } catch (err) {
        // ignore
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const role = userData.role || localStorage.getItem('userRole') || '';

    const [managersResult, studentsResult, teachersResult, requestsResult] = await Promise.allSettled([
      role === 'admin' ? getManagers() : Promise.resolve({ success: true, data: [] }),
      getStudents(),
      getTeachers(),
      role === 'admin' ? getRegistrationRequests() : Promise.resolve({ success: true, data: [] }),
    ]);

    if (managersResult.status === 'fulfilled' && managersResult.value?.success) {
      setManagers(managersResult.value.data || []);
    }
    if (studentsResult.status === 'fulfilled' && studentsResult.value?.success) {
      setStudents(studentsResult.value.data || []);
    }
    if (teachersResult.status === 'fulfilled' && teachersResult.value?.success) {
      setTeachers(teachersResult.value.data || []);
    }
    if (requestsResult.status === 'fulfilled' && requestsResult.value?.success) {
      setRegistrationRequests(requestsResult.value.data || []);
    }

    if (role === 'admin') {
      setAdmins([
        {
          id: userData.id || 'current-admin',
          firstName: userData.firstName || userData.name || 'Admin',
          lastName: userData.lastName || userData.surname || '',
          mobilePhone: userData.mobilePhone || userData.mobile_phone || '',
        },
      ]);
    } else {
      setAdmins([]);
    }

    const loadErrors = [];
    if (managersResult.status === 'rejected') loadErrors.push('managers');
    if (studentsResult.status === 'rejected') loadErrors.push('students');
    if (teachersResult.status === 'rejected') loadErrors.push('teachers');
    if (requestsResult.status === 'rejected') loadErrors.push('registration requests');
    if (loadErrors.length) {
      setErrors((prev) => ({ ...prev, submit: `Failed to load: ${loadErrors.join(', ')}.` }));
    }
  };

  const [managerForm, setManagerForm] = useState({ firstName: '', lastName: '', mobilePhone: '', password: '' });
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', mobilePhone: '', password: '' });
  const [teacherForm, setTeacherForm] = useState({ firstName: '', lastName: '', mobilePhone: '', subject: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
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
    if (!studentForm.password || studentForm.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
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
        password: studentForm.password,
        role: 'student',
      });
      if (res.success && res.data) {
        setStudents((s) => [res.data, ...s]);
        setStudentForm({ firstName: '', lastName: '', mobilePhone: '', password: '' });
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
    if (!teacherForm.password || teacherForm.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
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
        password: teacherForm.password,
        role: 'teacher',
      });
      if (res.success && res.data) {
        setTeachers((t) => [res.data, ...t]);
        setTeacherForm({ firstName: '', lastName: '', mobilePhone: '', subject: '', password: '' });
        setSuccessMsg('Teacher added successfully');
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to add teacher' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  const handleDeleteUser = async (userId, role) => {
    const ok = window.confirm(`Delete this ${role} permanently? This cannot be undone.`);
    if (!ok) return;

    setErrors({});
    setSuccessMsg('');
    try {
      await adminDeleteUser(userId);
      if (role === 'manager') setManagers((items) => items.filter((u) => u.id !== userId));
      if (role === 'student') setStudents((items) => items.filter((u) => u.id !== userId));
      if (role === 'teacher') setTeachers((items) => items.filter((u) => u.id !== userId));
      setSuccessMsg(`${role.charAt(0).toUpperCase() + role.slice(1)} deleted permanently`);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to delete user' });
    } finally {
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  const handleApproveRequest = async (req) => {
    const password = window.prompt(`Set initial password for ${req.firstName} ${req.lastName} (${req.role}). Minimum 6 characters.`);
    if (!password) return;
    if (password.length < 6) {
      setErrors({ submit: 'Password must be at least 6 characters to approve request.' });
      return;
    }
    try {
      await approveRegistrationRequest(req.id, password);
      setRegistrationRequests((items) => items.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r)));
      loadData();
      setSuccessMsg('Request approved and user created.');
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to approve request' });
    }
  };

  const handleRejectRequest = async (req) => {
    const reason = window.prompt(`Optional rejection reason for ${req.firstName} ${req.lastName}:`, 'Not eligible');
    try {
      await rejectRegistrationRequest(req.id, reason || '');
      setRegistrationRequests((items) => items.map((r) => (r.id === req.id ? { ...r, status: 'rejected' } : r)));
      setSuccessMsg('Request rejected.');
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to reject request' });
    }
  };

  const renderUserCard = (user, role) => (
    <div key={user.id} style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 15px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
      <div>
        <div style={{ fontWeight: '600' }}>{user.firstName} {user.lastName}</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          {user.mobilePhone}{role === 'teacher' && user.subject ? ` • ${user.subject}` : ''}
        </div>
      </div>
      {userRole === 'admin' && (
        <button
          type="button"
          onClick={() => handleDeleteUser(user.id, role)}
          style={{ border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', background: '#b91c1c', color: '#fff', fontSize: '0.8rem' }}
        >
          Delete
        </button>
      )}
    </div>
  );

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
              {errors.submit && <div className="error-message submit-error" style={{ marginTop: 10 }}>{errors.submit}</div>}
              {successMsg && <div style={{ color: '#22c55e', marginTop: 10 }}>{successMsg}</div>}

              <div style={{ marginTop: 25 }}>
                <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>Active Admins</h4>
                {admins.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15 }}>
                    {admins.map((a) => renderUserCard(a, 'admin'))}
                  </div>
                ) : (
                  <p style={{ marginTop: 12, opacity: 0.7 }}>No admins found.</p>
                )}
              </div>

              <div style={{ marginTop: 25 }}>
                <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>Active Managers ({managers.length})</h4>
                {managers.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15 }}>
                    {managers.map((m) => renderUserCard(m, 'manager'))}
                  </div>
                ) : (
                  <p style={{ marginTop: 12, opacity: 0.7 }}>No managers found.</p>
                )}
              </div>

              <div style={{ marginTop: 25 }}>
                <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>All Students ({students.length})</h4>
                {students.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15 }}>
                    {students.map((s) => renderUserCard(s, 'student'))}
                  </div>
                ) : (
                  <p style={{ marginTop: 12, opacity: 0.7 }}>No students found.</p>
                )}
              </div>

              <div style={{ marginTop: 25 }}>
                <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>All Teachers ({teachers.length})</h4>
                {teachers.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15 }}>
                    {teachers.map((t) => renderUserCard(t, 'teacher'))}
                  </div>
                ) : (
                  <p style={{ marginTop: 12, opacity: 0.7 }}>No teachers found.</p>
                )}
              </div>

              <div style={{ marginTop: 25 }}>
                <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
                  Registration Requests ({registrationRequests.filter((r) => r.status === 'pending').length} pending)
                </h4>
                {registrationRequests.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 15 }}>
                    {registrationRequests.map((req) => (
                      <div key={req.id} style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 15px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {req.firstName} {req.lastName} ({req.role})
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {req.mobilePhone}{req.subject ? ` • ${req.subject}` : ''} • {req.status}
                          </div>
                        </div>
                        {req.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={() => handleApproveRequest(req)} style={{ border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', background: '#15803d', color: '#fff', fontSize: '0.8rem' }}>
                              Approve
                            </button>
                            <button type="button" onClick={() => handleRejectRequest(req)} style={{ border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', background: '#b91c1c', color: '#fff', fontSize: '0.8rem' }}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'capitalize' }}>{req.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ marginTop: 12, opacity: 0.7 }}>No registration requests yet.</p>
                )}
              </div>
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
                    <div className="form-group">
                      <label className="form-label">Password <span className="required">*</span></label>
                      <input type="password" name="password" value={studentForm.password} onChange={handleStudentChange} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="At least 6 characters" />
                      {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>
                    {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
                    {successMsg && <div style={{ color: '#22c55e' }}>{successMsg}</div>}
                    <button type="submit" className="submit-button" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Assign Student'}</button>
                  </form>

                  {students.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                      <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginBottom: 12 }}>Assigned Students</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {students.map((s) => renderUserCard(s, 'student'))}
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
                      <div className="form-group">
                        <label className="form-label">Password <span className="required">*</span></label>
                        <input type="password" name="password" value={teacherForm.password} onChange={handleTeacherChange} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="At least 6 characters" />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                      </div>
                    </div>
                    {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
                    {successMsg && <div style={{ color: '#22c55e' }}>{successMsg}</div>}
                    <button type="submit" className="submit-button" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Assign Teacher'}</button>
                  </form>

                  {teachers.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                      <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginBottom: 12 }}>Assigned Teachers</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {teachers.map((t) => renderUserCard(t, 'teacher'))}
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
