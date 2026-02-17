import React from 'react';

const Instructions = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Instructions Page
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          marginBottom: '24px'
        }}>
          ✅ Successfully redirected from Registration!
        </p>
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          fontStyle: 'italic'
        }}>
          This page will be developed by the team later.
        </p>
      </div>
    </div>
  );
};

export default Instructions;
