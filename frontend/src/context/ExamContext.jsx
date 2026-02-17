import React, { createContext, useState, useMemo } from 'react';

// Create ExamContext
export const ExamContext = createContext(null);

// ExamProvider component
export const ExamProvider = ({ children }) => {
  // State for current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // State for answers - object map: { [index]: selectedValue }
  const [answers, setAnswers] = useState({});

  // Method to update answers immutably
  const setAnswer = (index, value) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [index]: value
    }));
  };

  // Memoize the context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      currentQuestionIndex,
      setCurrentQuestionIndex,
      answers,
      setAnswer
    }),
    [currentQuestionIndex, answers]
  );

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};
