import React, { createContext, useContext, useState, useEffect } from "react";
import { examService } from "../services/examService";

const ExamContext = createContext();

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [maxReachedPageIndex, setMaxReachedPageIndex] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [examId, setExamId] = useState(null);
    const [sessionToken, setSessionToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Timer values
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [durationMinutes, setDurationMinutes] = useState(60);

    const QUESTIONS_PER_PAGE = 5;

    // Load session from localStorage on mount
    useEffect(() => {
        const savedSession = localStorage.getItem('exam_session');
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            setSessionToken(sessionData.token);
            setExamId(sessionData.examId);
            setStartTime(sessionData.startTime);
        }
    }, []);

    // Fetch questions and resume answers if session exists but data is missing
    useEffect(() => {
        const resumeSession = async () => {
            if (sessionToken && examId && questions.length === 0) {
                setLoading(true);
                try {
                    const fetchedQuestions = await examService.getQuestions(examId);
                    setQuestions(fetchedQuestions);

                    // We could also reach out to get the current answers if we had an endpoint
                    // For now, let's just make sure questions are back
                } catch (err) {
                    console.error("Failed to resume session questions:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        resumeSession();
    }, [sessionToken, examId, questions.length]);

    const startExam = async (studentId, targetExamId) => {
        setLoading(true);
        try {
            const session = await examService.startSession(studentId, targetExamId);
            const fetchedQuestions = await examService.getQuestions(targetExamId);

            setSessionToken(session.session_token);
            setExamId(targetExamId);
            setQuestions(fetchedQuestions);
            setStartTime(Date.now());

            localStorage.setItem('exam_session', JSON.stringify({
                token: session.session_token,
                examId: targetExamId,
                startTime: Date.now()
            }));

            setError(null);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const setAnswer = async (questionId, value) => {
        // Optimistic UI update
        const oldAnswers = { ...answers };
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));

        if (sessionToken) {
            try {
                await examService.submitAnswer(sessionToken, questionId, value);
            } catch (err) {
                console.error("Autosave failed:", err);
                // Maybe don't revert to avoid jarring experience, but show warning
            }
        }
    };

    const goNextPage = () => {
        const nextIndex = currentPageIndex + 1;
        setCurrentPageIndex(nextIndex);
        if (nextIndex > maxReachedPageIndex) {
            setMaxReachedPageIndex(nextIndex);
        }
    };

    const submitGlobalExam = async () => {
        if (sessionToken) {
            try {
                const result = await examService.completeSession(sessionToken);
                setEndTime(Date.now());
                localStorage.removeItem('exam_session');
                return { success: true, sessionId: result.session_id };
            } catch (err) {
                setError(err.message);
                return { success: false };
            }
        }
        return { success: false };
    };

    const value = {
        currentPageIndex,
        answers,
        questions,
        examId,
        sessionToken,
        loading,
        error,
        setAnswer,
        goNextPage,
        QUESTIONS_PER_PAGE,
        maxReachedPageIndex,
        startTime,
        endTime,
        durationMinutes,
        startExam,
        submitGlobalExam,
    };

    return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};
