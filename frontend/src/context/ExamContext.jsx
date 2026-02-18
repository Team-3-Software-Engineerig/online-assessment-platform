import React, { createContext, useContext, useState } from "react";

const ExamContext = createContext();

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [maxReachedPageIndex, setMaxReachedPageIndex] = useState(0);

    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(null);

    const QUESTIONS_PER_PAGE = 5;

    const setAnswer = (questionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const goNextPage = () => {
        const nextIndex = currentPageIndex + 1;
        setCurrentPageIndex(nextIndex);
        if (nextIndex > maxReachedPageIndex) {
            setMaxReachedPageIndex(nextIndex);
        }
    };

    const submitGlobalExam = () => {
        setEndTime(Date.now());
    };

    const value = {
        currentPageIndex,
        answers,
        setAnswer,
        goNextPage,
        QUESTIONS_PER_PAGE,
        maxReachedPageIndex,
        startTime,
        endTime,
        submitGlobalExam,
    };

    return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};
