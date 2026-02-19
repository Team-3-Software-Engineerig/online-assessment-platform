import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserRoleSelection.css';

const UserRoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'For 9th grade students taking assessments',
      icon: '🎓',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
      route: '/register/student',
      features: ['Take assessments', 'View results', 'Track progress']
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'For teachers creating and managing exams',
      icon: '👨‍🏫',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
      route: '/register/teacher',
      features: ['Create exams', 'Manage questions', 'View analytics']
    },
    {
      id: 'manager',
      title: 'Manager',
      description: 'For managers accessing student information',
      icon: '💼',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
      route: '/register/manager',
      features: ['View student lists', 'Access reports', 'Manage data']
    },
  ];

  const handleRoleSelect = (route) => {
    navigate(route);
  };

  return (
    <div className="role-selection-page">
      <div className="role-selection-wrapper">
        {/* Header Section */}
        <div className="role-selection-header">
          <div className="header-decoration">
            <div className="decoration-circle"></div>
            <div className="decoration-circle"></div>
            <div className="decoration-circle"></div>
          </div>
          <div className="welcome-icon">👋</div>
          <h1 className="welcome-title">Welcome to Assessment Platform</h1>
          <p className="welcome-subtitle">
            Please select your role to continue with registration
          </p>
          <div className="header-divider">
            <div className="divider-line"></div>
            <div className="divider-dot"></div>
            <div className="divider-line"></div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="role-cards-container">
          {roles.map((role, index) => (
            <div
              key={role.id}
              className="role-card-modern"
              onClick={() => handleRoleSelect(role.route)}
              style={{
                '--role-color': role.color,
                '--role-gradient': role.gradient,
                '--role-light-gradient': role.lightGradient,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="role-card-content">
                <div className="role-card-header">
                  <div className="role-icon-wrapper">
                    <div className="role-icon-bg" style={{ background: role.gradient }}>
                      <span className="role-icon-large">{role.icon}</span>
                    </div>
                  </div>
                  <div className="role-badge" style={{ background: role.lightGradient, color: role.color }}>
                    {role.title}
                  </div>
                </div>

                <div className="role-text-content">
                  <h2 className="role-title-modern">{role.title}</h2>
                  <p className="role-description-modern">{role.description}</p>

                  <div className="role-features">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="feature-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="role-card-footer">
                  <div className="role-arrow-modern">
                    <span>Get Started</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="role-card-hover-effect"></div>
              <div className="role-card-shine"></div>
            </div>
          ))}
        </div>

        {/* Quick Info Section */}
        <div className="quick-info-section">
          <div className="info-item">
            <div className="info-icon">🔒</div>
            <div className="info-text">
              <strong>Secure</strong>
              <span>Your data is protected</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⚡</div>
            <div className="info-text">
              <strong>Fast</strong>
              <span>Quick registration process</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">📱</div>
            <div className="info-text">
              <strong>Easy</strong>
              <span>Simple and intuitive</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>
            Already have an account? <span
              style={{ color: '#6366f1', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate('/login')}
            >
              Login instead
            </span>
          </p>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="background-decorations">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-grid"></div>
      </div>
    </div>
  );
};

export default UserRoleSelection;
