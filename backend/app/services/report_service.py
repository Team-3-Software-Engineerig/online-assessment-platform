from bson import ObjectId
import app.db.db as db
from datetime import datetime

def _db():
    """Always return the current live database object."""
    if db.database is None:
        raise RuntimeError("Database not connected")
    return db.database

async def get_session_by_id(session_id: str):
    """Fetch an exam session by ID."""
    session = await _db().exam_sessions.find_one({"_id": ObjectId(session_id)})
    if session:
        session["id"] = str(session["_id"])
    return session

async def calculate_score(session_id: str):
    """
    Calculate the score for a completed exam session.
    Compares responses in the session with the correct answers in the questions collection.
    """
    session = await get_session_by_id(session_id)
    if not session:
        raise ValueError("Session not found")
        
    responses = session.get("responses", {})
    correct_count = 0
    total_questions = 0
    
    # Get all questions for this exam to compare answers
    cursor = _db().questions.find({"exam_id": session["exam_id"]})
    async for question in cursor:
        total_questions += 1
        q_id = str(question["_id"])
        correct_answer = question.get("answer")
        student_answer = responses.get(q_id)
        
        if student_answer and correct_answer and str(student_answer).lower() == str(correct_answer).lower():
            correct_count += 1
            
    score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    
    report_doc = {
        "student_id": session["student_id"],
        "exam_id": session["exam_id"],
        "session_id": session["_id"],
        "score": correct_count,
        "total": total_questions,
        "percentage": score_percentage,
        "created_at": datetime.utcnow()
    }
    
    result = await _db().reports.insert_one(report_doc)
    report_doc["id"] = str(result.inserted_id)
    
    return report_doc

async def generate_pdf_report(session_id: str):
    """
    Generate a server-side PDF report for an exam session.
    """
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from app.clients.user_client import find_user_by_id

    session = await get_session_by_id(session_id)
    if not session:
        raise ValueError("Session not found")
        
    report = await get_report_by_session(session_id)
    if not report:
        report = await calculate_score(session_id)
        
    student = await find_user_by_id(str(session["student_id"]))
    exam = await _db().exams.find_one({"_id": session["exam_id"]})
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    # Header
    elements.append(Paragraph("Online Assessment Platform", styles['Title']))
    elements.append(Paragraph("Exam Performance Report", styles['Heading1']))
    elements.append(Spacer(1, 12))
    
    # Student Info
    student_data = [
        ["Student Name:", f"{student.get('name')} {student.get('surname')}"],
        ["Student ID:", str(student.get('_id'))],
        ["Mobile Phone:", student.get('mobile_phone')],
        ["Exam Subject:", exam.get('title', 'N/A')],
        ["Completed At:", report.get('created_at').strftime("%Y-%m-%d %H:%M:%S")]
    ]
    
    table = Table(student_data, colWidths=[120, 300])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))
    
    # Results
    score_style = ParagraphStyle('ScoreStyle', parent=styles['Normal'], fontSize=24, leading=30, alignment=1)
    elements.append(Paragraph(f"Score: {report['score']} / {report['total']}", score_style))
    elements.append(Paragraph(f"Percentage: {round(report['percentage'])}%", score_style))
    elements.append(Spacer(1, 24))
    
    # Footer
    elements.append(Spacer(1, 48))
    elements.append(Paragraph("This is a system-generated report.", styles['Italic']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

async def get_report_by_session(session_id: str):
    """Retrieve an existing report for a session."""
    report = await _db().reports.find_one({"session_id": ObjectId(session_id)})
    if report:
        report["id"] = str(report["_id"])
    return report
