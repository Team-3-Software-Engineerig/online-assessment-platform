
import React from 'react';
import { useExam } from '../context/ExamContext';
import jsPDF from 'jspdf';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Download, Clock, Calendar, FileText, ShieldCheck } from 'lucide-react';
import '../styles/exam.css';

const Result = () => {
    const { startTime, endTime } = useExam();
    const location = useLocation();
    const { totalQuestions, answeredCount } = location.state || { totalQuestions: 0, answeredCount: 0 };

    // Retrieve student data
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');
    const studentName = `${studentData.firstName || 'Student'} ${studentData.lastName || ''}`.trim();
    const studentPhone = studentData.mobilePhone || 'N/A';
    const studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`; // Placeholder ID

    // Format dates
    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : new Date();

    // Calculate duration
    const durationMs = endDate - startDate;
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);

    const downloadPDF = () => {
        const doc = new jsPDF();

        // Colors
        const primaryColor = [102, 126, 234]; // Accents
        const textColor = [30, 41, 59]; // Dark Grey
        const secondaryText = [100, 116, 139]; // Light Grey
        const successColor = [22, 163, 74]; // Green
        const pendingColor = [234, 179, 8]; // Yellow/Orange

        // --- 1. Header Section ---
        doc.setFontSize(10);
        doc.setTextColor(...secondaryText);
        doc.text("Online Assessment Platform", 20, 15);

        doc.setFontSize(22);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Exam Submission Confirmation", 20, 25);

        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text("9th Grade Assessment - 2024 Session", 20, 32);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(20, 38, 190, 38);

        // --- 2. Submission Status Box ---
        doc.setFillColor(240, 253, 244); // Light Green bg
        doc.setDrawColor(22, 163, 74); // Green border
        doc.roundedRect(20, 45, 170, 25, 2, 2, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(...successColor);
        doc.setFont('helvetica', 'bold');
        doc.text("STATUS: Submitted Successfully", 30, 55);

        doc.setTextColor(...pendingColor);
        doc.text("RESULT STATUS: Pending Release", 30, 63);

        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.text("SUBMISSION VERIFIED: Recorded in System", 110, 59);

        // --- 3. Student Information ---
        let yPos = 85;
        doc.setFontSize(14);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Student Information", 20, yPos);

        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondaryText);
        doc.text("Name:", 20, yPos);
        doc.text("Student ID:", 110, yPos);

        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text(studentName, 50, yPos);
        doc.text(studentId, 140, yPos);

        yPos += 8;
        doc.setTextColor(...secondaryText);
        doc.setFont('helvetica', 'normal');
        doc.text("Class:", 20, yPos);
        doc.text("Phone:", 110, yPos);

        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text("9th Grade", 50, yPos);
        doc.text(studentPhone, 140, yPos);

        // --- 4. Exam Details ---
        yPos += 20;
        doc.setFontSize(14);
        doc.text("Exam Details", 20, yPos);

        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondaryText);

        doc.text("Start Time:", 20, yPos);
        doc.setTextColor(...textColor);
        doc.text(startDate.toLocaleString(), 50, yPos);

        yPos += 8;
        doc.setTextColor(...secondaryText);
        doc.text("Submission:", 20, yPos);
        doc.setTextColor(...textColor);
        doc.text(endDate.toLocaleString(), 50, yPos);

        yPos += 8;
        doc.setTextColor(...secondaryText);
        doc.text("Duration:", 20, yPos);
        doc.setTextColor(...textColor);
        doc.text(`${durationMinutes}m ${durationSeconds}s`, 50, yPos);

        yPos += 8;
        doc.setTextColor(...secondaryText);
        doc.text("Mode:", 20, yPos);
        doc.setTextColor(...textColor);
        doc.text("Online - Remote Proctored", 50, yPos);

        // --- 5. Attempt Summary (NO RESULT) ---
        yPos += 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Attempt Summary", 20, yPos);

        // Table Header
        yPos += 8;
        doc.setFillColor(241, 245, 249);
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text("Total Questions", 25, yPos + 6);
        doc.text("Questions Attempted", 80, yPos + 6);
        doc.text("Unanswered", 145, yPos + 6);

        // Table Body
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.text(`${totalQuestions}`, 25, yPos + 6);
        doc.text(`${answeredCount}`, 80, yPos + 6);
        doc.text(`${totalQuestions - answeredCount}`, 145, yPos + 6);

        doc.setDrawColor(226, 232, 240);
        doc.line(20, yPos + 10, 190, yPos + 10);

        // --- 6. Declaration Section ---
        yPos += 30;
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');
        const declaration = "This document confirms that the student has successfully submitted the examination. Evaluation is currently in progress. Results will be published separately by the institution.";
        const splitDecl = doc.splitTextToSize(declaration, 170);
        doc.text(splitDecl, 20, yPos);

        // --- 7. Academic Integrity Notice ---
        yPos += 20;
        doc.setFontSize(9);
        doc.setTextColor(...secondaryText);
        doc.text("The exam submission has been securely recorded by the ExamFlow system according to examination policies.", 20, yPos);

        // --- 8. Submission Metadata ---
        yPos += 30;
        const subId = `SUB-${Date.now().toString().slice(-6)}`;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Submission ID: ${subId}`, 20, yPos);
        doc.text(`Exam ID: EX-MATH-ENG-09`, 80, yPos);
        doc.text(`Generated: ${new Date().toISOString()}`, 140, yPos);

        // --- 9. Footer ---
        doc.text("This is a system-generated document and does not require a signature.", 105, 285, { align: 'center' });

        doc.save(`${studentName.replace(/\s+/g, '_')}_Submission_Report.pdf`);
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
                                    <FileText size={12} style={{ marginRight: '4px' }} /> Questions
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>
                                    {answeredCount} / {totalQuestions} Attempted
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
