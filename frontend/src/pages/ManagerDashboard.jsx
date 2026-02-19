import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Phone, FileText, CheckCircle, XCircle } from 'lucide-react';
import './TeacherDashboard.css';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // Fetch students
            const studentsRes = await fetch('/api/admin/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Fetch reports
            const reportsRes = await fetch('/api/admin/reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (studentsRes.ok && reportsRes.ok) {
                const studentsData = await studentsRes.json();
                const reportsData = await reportsRes.json();

                setReports(reportsData);

                // Merge data: Find report for each student
                const mergedData = studentsData.map(student => {
                    const report = reportsData.find(r => r.student_id === student.id);
                    return {
                        ...student,
                        hasSubmitted: !!report,
                        score: report ? report.score : null,
                        total: report ? report.total : null,
                        percentage: report ? report.percentage : null,
                        submittedAt: report ? report.created_at : null,
                        sessionId: report ? report.session_id : null
                    };
                });

                setStudents(mergedData);
            }
        } catch (err) {
            console.error("Failed to fetch manager data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (sessionId, studentName) => {
        if (!sessionId) return;
        const token = localStorage.getItem('token');
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
            console.error("Download error:", err);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.includes(searchTerm) ||
        s.mobile_phone.includes(searchTerm)
    );

    return (
        <div className="teacher-dashboard">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-content">
                        <div className="welcome-section">
                            <h1 className="welcome-greeting">Manager Portal 💼</h1>
                            <p className="dashboard-subtitle">Monitoring student registration, contact data, and assessment progress</p>
                        </div>
                    </div>
                    <button className="btn-secondary" onClick={() => navigate('/login')} style={{ background: '#f1f5f9', color: '#475569' }}>Logout</button>
                </div>

                <div className="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>TOTAL REGISTERED</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{students.length}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>EXAMS SUBMITTED</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{students.filter(s => s.hasSubmitted).length}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>PENDING EXAMS</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{students.filter(s => !s.hasSubmitted).length}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>AVG. PERFORMANCE</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#6366f1' }}>
                            {students.filter(s => s.hasSubmitted).length > 0
                                ? Math.round(students.filter(s => s.hasSubmitted).reduce((acc, s) => acc + s.percentage, 0) / students.filter(s => s.hasSubmitted).length)
                                : 0}%
                        </div>
                    </div>
                </div>

                <div className="search-bar" style={{ marginBottom: '24px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search student by name, ID, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px' }}
                    />
                </div>

                <div className="dashboard-content">
                    {loading ? (
                        <div className="loading-state">Loading student data...</div>
                    ) : (
                        <div className="students-table-container" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>STUDENT NAME</th>
                                        <th style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>CONTACT</th>
                                        <th style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>STATUS</th>
                                        <th style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>SCORE</th>
                                        <th style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{student.name}</div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {student.id}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                                                    <Phone size={14} />
                                                    {student.mobile_phone}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {student.hasSubmitted ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                                                        <CheckCircle size={16} /> Submitted
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '14px', fontWeight: '600' }}>
                                                        <XCircle size={16} /> Pending
                                                    </div>
                                                )}
                                                {student.submittedAt && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(student.submittedAt).toLocaleDateString()}</div>}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {student.hasSubmitted ? (
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{Math.round(student.percentage)}%</div>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{student.score}/{student.total}</div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#cbd5e1' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        onClick={() => handleDownloadReport(student.sessionId, student.name)}
                                                        disabled={!student.hasSubmitted}
                                                        style={{
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0',
                                                            background: student.hasSubmitted ? '#f8fafc' : '#ffffff',
                                                            cursor: student.hasSubmitted ? 'pointer' : 'not-allowed',
                                                            color: student.hasSubmitted ? '#1e293b' : '#cbd5e1'
                                                        }}
                                                        title="Download Student PDF Report"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
                                    <p style={{ color: '#64748b' }}>No students match your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
