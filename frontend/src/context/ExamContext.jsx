import React, { createContext, useContext, useState } from "react";

const ExamContext = createContext();

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [examInfo, setExamInfo] = useState(null);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [maxReachedPageIndex, setMaxReachedPageIndex] = useState(0);

    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(null);

    const [sessionToken, setSessionToken] = useState(null);

    const QUESTIONS_PER_PAGE = 5;

    const startExam = (examData, questionsList, token) => {
        setExamInfo(examData);
        setQuestions(questionsList);
        setSessionToken(token);
        setCurrentPageIndex(0);
        setAnswers({});
        setMaxReachedPageIndex(0);
    };

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
        examInfo,
        questions,
        sessionToken,
        currentPageIndex,
        answers,
        setAnswer,
        goNextPage,
        QUESTIONS_PER_PAGE,
        maxReachedPageIndex,
        startTime,
        endTime,
        submitGlobalExam,
        startExam,
        loading,
        setLoading
    };

    return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};
