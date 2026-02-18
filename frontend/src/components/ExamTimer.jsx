import React, { useState, useEffect } from 'react';

const ExamTimer = ({ initialSeconds, onExpire }) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    useEffect(() => {
        // If time is already up, don't start
        if (secondsLeft <= 0) return;

        const intervalId = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    if (onExpire) onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [secondsLeft, onExpire]);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <span className="exam-timer" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {formatTime(secondsLeft)}
        </span>
    );
};

export default ExamTimer;
