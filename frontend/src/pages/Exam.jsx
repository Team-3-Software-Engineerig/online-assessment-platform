import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Exam = () => {
  const navigate = useNavigate();

  return (
    <div className="registration-layout">
      <div className="registration-container">
        <div className="registration-card">
          <div className="registration-header">
            <h1>Exam Placeholder</h1>
            <p className="subtitle">The exam will start here. This is a placeholder page.</p>
          </div>

          <div>
            <p>Please implement the exam interface. For now, you can return to registration.</p>
            <button className="submit-button" onClick={() => navigate('/register')}>Back to Register</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exam;
