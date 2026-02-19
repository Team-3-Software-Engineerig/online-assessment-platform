
import React from 'react';
import { useExam } from '../context/ExamContext';
import jsPDF from 'jspdf';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Download, Clock, Calendar, FileText, ShieldCheck } from 'lucide-react';
import '../styles/exam.css';

const Result = () => {
    const { startTime, endTime } = useExam();
    const location = useLocation();
    const { totalQuestions, answeredCount, sessionId } = location.state || { totalQuestions: 0, answeredCount: 0 };

    const [report, setReport] = React.useState(null);
    const [loading, setLoading] = React.useState(!!sessionId);

    React.useEffect(() => {
        if (sessionId) {
            import('../services/examService').then(({ examService }) => {
                examService.getReport(sessionId)
                    .then(data => {
                        setReport(data);
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Failed to fetch report:", err);
                        setLoading(false);
                    });
            });
        }
    }, [sessionId]);

    // Retrieve student data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const studentName = userData.name || 'Student';
    const studentPhone = userData.mobile_phone || 'N/A';
    const reportScore = report ? report.score : '...';
    const reportPercentage = report ? `${Math.round(report.percentage)}%` : '...';

    // Format dates
    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : new Date();

    // Calculate duration
    const durationMs = endDate - startDate;
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);

    const downloadPDF = async () => {
        if (!sessionId) return;
        try {
            const response = await fetch(`/api/reports/session/${sessionId}/pdf`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Exam_Report_${studentName.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to download PDF report.");
            }
        } catch (err) {
            console.error("PDF download error:", err);
            alert("Connection error while downloading report.");
        }
    };

    return (
        <div className="exam-layout">
            <div className="exam-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div id="result-card" className="result-card" style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div className="icon-wrapper" style={{
                        background: '#dcfce7',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#16a34a'
                    }}>
                        <CheckCircle size={48} />
                    </div>

                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        Submission Confirmed
                    </h1>
                    <p style={{ color: '#64748b', marginBottom: '32px' }}>
                        Your exam has been securely submitted. Please check the confirmation details below.
                    </p>

                    <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '12px',
                        marginBottom: '32px',
                        textAlign: 'left'
                    }}>
                        <div className="stat-item" style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#15803d', fontSize: '14px', fontWeight: '700' }}>
                                <ShieldCheck size={18} /> Status: Verified
                            </div>
                            <div style={{ fontSize: '14px', color: '#166534' }}>
                                Your responses have been recorded in the system.
                            </div>
                        </div>

                        <div className="stat-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                    <Clock size={12} style={{ marginRight: '4px' }} /> Submission Time
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>
                                    {endDate.toLocaleTimeString()}
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                    <FileText size={12} style={{ marginRight: '4px' }} /> Result
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>
                                    Score: {reportScore} / {totalQuestions} ({reportPercentage})
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={downloadPDF} className="btn-primary" style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '16px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)'
                    }}>
                        <Download size={20} /> Download Confirmation Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Result;
