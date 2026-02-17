import React, { useContext, useState } from 'react';
import { ExamContext } from '../context/ExamContext.jsx';
import '../styles/exam.css';

// Demo questions for placeholder
const demoQuestions = [
  {
    id: 1,
    text: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"]
  },
  {
    id: 2,
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Jupiter", "Mars", "Saturn"]
  },
  {
    id: 3,
    text: "What is 7 × 8?",
    options: ["54", "56", "63", "64"]
  },
  {
    id: 4,
    text: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"]
  }
];

const Exam = () => {
  const { currentQuestionIndex, setCurrentQuestionIndex, answers, setAnswer } = useContext(ExamContext);
  const [examComplete, setExamComplete] = useState(false);

  const currentQuestion = demoQuestions[currentQuestionIndex];
  const totalQuestions = demoQuestions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Handle option selection
  const handleOptionSelect = (option) => {
    setAnswer(currentQuestionIndex, option);
  };

  // Handle next button click
  const handleNext = () => {
    const confirmMessage = "You cannot go back after continuing. Are you sure you want to proceed?";

    if (window.confirm(confirmMessage)) {
      if (isLastQuestion) {
        // Show completion message
        setExamComplete(true);
      } else {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  // If exam is complete, show completion message
  if (examComplete) {
    return (
      <div className="exam-layout">
        <div className="completion-message">
          <h2>🎉 Exam Complete (Demo)</h2>
          <p>
            You have successfully completed the demo exam!<br />
            Thank you for testing the exam interface.
          </p>
          <p style={{ marginTop: '20px', fontSize: '16px', color: '#718096' }}>
            Total Questions Answered: {Object.keys(answers).length} / {totalQuestions}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-layout">
      {/* Header */}
      <div className="exam-header">
        <h1 className="exam-title">Online Assessment</h1>
        <div className="exam-timer">
          ⏱️ Timer: 00:00:00
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <div className="question-header">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>

        <div className="question-text">
          {currentQuestion.text}
        </div>

        {/* Options */}
        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${answers[currentQuestionIndex] === option ? 'selected' : ''
                }`}
              onClick={() => handleOptionSelect(option)}
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button className="next-button" onClick={handleNext}>
          {isLastQuestion ? 'Submit Exam' : 'Next Question'} →
        </button>
      </div>
    </div>
  );
};

export default Exam;
