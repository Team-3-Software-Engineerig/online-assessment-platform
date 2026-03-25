import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Search, Phone, FileText, CheckCircle, XCircle, ArrowLeft, Award } from 'lucide-react';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [students, setStudents] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExam, setSelectedExam] = useState('all');
    const [examOptions, setExamOptions] = useState([]);

    // Get auth token correctly from userData
    const getToken = () => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            return userData.access_token || localStorage.getItem('token') || '';
        } catch { return ''; }
    };

    const userRole = localStorage.getItem('userRole') || '';
    const isTeacher = userRole === 'teacher';
    const backDashboardRoute = isTeacher ? '/teacher/dashboard' : '/manager/dashboard';

    useEffect(() => {
        // Auto-select exam from URL query param ?exam=<id>
        const params = new URLSearchParams(location.search);
        const examParam = params.get('exam');
        if (examParam) setSelectedExam(examParam);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = getToken();
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        try {
            const [studentsRes, reportsRes] = await Promise.all([
                fetch('/api/admin/students', { headers }),
                fetch('/api/admin/reports', { headers }),
            ]);

            if (studentsRes.ok && reportsRes.ok) {
                const studentsData = await studentsRes.json();
                const reportsData = await reportsRes.json();

                setReports(reportsData);

                // Build unique exam options for the filter
                const exams = {};
                reportsData.forEach(r => {
                    if (r.exam_id && r.exam_title) exams[r.exam_id] = r.exam_title;
                });
                setExamOptions(Object.entries(exams).map(([id, title]) => ({ id, title })));

                // Merge all reports for each student (a student may have done multiple exams)
                const mergedData = studentsData.map(student => {
                    const studentReports = reportsData.filter(r => r.student_id === student.id);
                    const latestReport = studentReports.sort((a, b) =>
                        new Date(b.created_at) - new Date(a.created_at)
                    )[0];

                    return {
                        ...student,
                        allReports: studentReports,
                        hasSubmitted: studentReports.length > 0,
                        score: latestReport?.score ?? null,
                        total: latestReport?.total ?? null,
                        percentage: latestReport?.percentage ?? null,
                        submittedAt: latestReport?.created_at ?? null,
                        sessionId: latestReport?.session_id ?? null,
                        examTitle: latestReport?.exam_title ?? null,
                        examId: latestReport?.exam_id ?? null,
                    };
                });

                setStudents(mergedData);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (sessionId, studentName) => {
        if (!sessionId) return;
        const token = getToken();
        try {
            const response = await fetch(`/api/reports/session/${sessionId}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Report_${studentName.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error('Download error:', err);
        }
    };

    // Filter by search and selected exam
    const filteredStudents = students.filter(s => {
        const matchesSearch =
            (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.id || '').includes(searchTerm) ||
            (s.mobile_phone || '').includes(searchTerm);

        if (!matchesSearch) return false;
        if (selectedExam === 'all') return true;
        return s.allReports?.some(r => r.exam_id === selectedExam);
    });

    // When a specific exam is filtered, show that exam's score for the student
    const getStudentScoreForExam = (student) => {
        if (selectedExam === 'all') return student;
        const report = student.allReports?.find(r => r.exam_id === selectedExam);
        if (!report) return { ...student, hasSubmitted: false, score: null, total: null, percentage: null, submittedAt: null, sessionId: null, examTitle: null };
        return { ...student, hasSubmitted: true, score: report.score, total: report.total, percentage: report.percentage, submittedAt: report.created_at, sessionId: report.session_id, examTitle: report.exam_title };
    };

    const submittedCount = selectedExam === 'all'
        ? students.filter(s => s.hasSubmitted).length
        : filteredStudents.filter(s => s.allReports?.some(r => r.exam_id === selectedExam)).length;

    const avgPercentage = (() => {
        const submitted = filteredStudents.map(getStudentScoreForExam).filter(s => s.hasSubmitted && s.percentage != null);
        if (!submitted.length) return 0;
        return Math.round(submitted.reduce((acc, s) => acc + s.percentage, 0) / submitted.length);
    })();

    const getScoreBadgeColor = (pct) => {
        if (pct == null) return '#94a3b8';
        if (pct >= 80) return '#10b981';
        if (pct >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => navigate(backDashboardRoute)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569', fontWeight: '600', fontSize: '14px' }}
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>
                        <div style={{ height: '32px', width: '1px', background: '#e2e8f0' }} />
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                                📊 Student Results
                            </h1>
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Assessment submissions & grades</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569', fontWeight: '600', fontSize: '14px' }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 40px' }}>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {[
                        { label: 'Total Students', value: students.length, icon: <Users size={22} />, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Submitted', value: submittedCount, icon: <CheckCircle size={22} />, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Pending', value: students.length - submittedCount, icon: <XCircle size={22} />, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Avg. Score', value: `${avgPercentage}%`, icon: <Award size={22} />, color: '#8b5cf6', bg: '#f5f3ff' },
                    ].map((stat) => (
                        <div key={stat.label} style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                                <div style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b' }}>{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', background: 'white', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    {examOptions.length > 0 && (
                        <select
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', background: 'white', cursor: 'pointer', color: '#374151' }}
                        >
                            <option value="all">All Exams</option>
                            {examOptions.map(ex => (
                                <option key={ex.id} value={ex.id}>{ex.title}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Table */}
                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                    {loading ? (
                        <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '16px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
                            Loading results...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div style={{ padding: '80px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                            <p style={{ color: '#94a3b8', fontSize: '16px' }}>No students found.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    {['Student', 'Phone', 'Exam', 'Status', 'Score', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(rawStudent => {
                                    const student = getStudentScoreForExam(rawStudent);
                                    const pct = student.percentage;
                                    const badgeColor = getScoreBadgeColor(pct);

                                    return (
                                        <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                        >
                                            {/* Student */}
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                                                        {(student.name || 'S')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{student.name || 'Unknown'}</div>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {student.id?.slice(-8)}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Phone */}
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px' }}>
                                                    <Phone size={14} /> {student.mobile_phone || '—'}
                                                </div>
                                            </td>

                                            {/* Exam */}
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                                    {student.hasSubmitted ? (student.examTitle || 'Exam') : '—'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '16px 20px' }}>
                                                {student.hasSubmitted ? (
                                                    <div>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: '700', background: '#f0fdf4', padding: '4px 10px', borderRadius: '20px' }}>
                                                            <CheckCircle size={14} /> Submitted
                                                        </div>
                                                        {student.submittedAt && (
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                                                {new Date(student.submittedAt).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '13px', fontWeight: '700', background: '#fffbeb', padding: '4px 10px', borderRadius: '20px' }}>
                                                        <XCircle size={14} /> Pending
                                                    </div>
                                                )}
                                            </td>

                                            {/* Score */}
                                            <td style={{ padding: '16px 20px' }}>
                                                {student.hasSubmitted && pct != null ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '18px', fontWeight: '800', color: badgeColor }}>
                                                                {Math.round(pct)}%
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                                {student.score}/{student.total} correct
                                                            </div>
                                                        </div>
                                                        {/* Score bar */}
                                                        <div style={{ width: '60px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${Math.round(pct)}%`, background: badgeColor, borderRadius: '4px', transition: 'width 0.4s' }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#cbd5e1', fontSize: '20px' }}>—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '16px 20px' }}>
                                                <button
                                                    onClick={() => handleDownloadReport(student.sessionId, student.name)}
                                                    disabled={!student.hasSubmitted}
                                                    title={student.hasSubmitted ? 'Download PDF Report' : 'No submission yet'}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '8px 14px', borderRadius: '8px',
                                                        border: `1px solid ${student.hasSubmitted ? '#c7d2fe' : '#e2e8f0'}`,
                                                        background: student.hasSubmitted ? '#eef2ff' : '#f8fafc',
                                                        color: student.hasSubmitted ? '#4f46e5' : '#cbd5e1',
                                                        cursor: student.hasSubmitted ? 'pointer' : 'not-allowed',
                                                        fontSize: '13px', fontWeight: '600'
                                                    }}
                                                >
                                                    <FileText size={14} />
                                                    {student.hasSubmitted ? 'PDF Report' : 'No Report'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
