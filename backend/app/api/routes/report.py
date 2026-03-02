from fastapi import APIRouter, HTTPException
from app.services import report_service
import app.db.db as db
from bson import ObjectId

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/session/{session_token_or_id}")
async def get_report(session_token_or_id: str):
    """Get the report for a specific exam session (by session token or ObjectId)."""
    database = db.database
    if database is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        # Step 1: Try to find the session - first by token (UUID string), then by ObjectId
        session = await database.exam_sessions.find_one({"session_token": session_token_or_id})
        if not session:
            # Try by ObjectId
            try:
                session = await database.exam_sessions.find_one({"_id": ObjectId(session_token_or_id)})
            except Exception:
                pass
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_id = str(session["_id"])
        
        # Step 2: Get or calculate the report
        report = await report_service.get_report_by_session(session_id)
        if not report:
            report = await report_service.calculate_score(session_id)
        
        # Serialize ObjectIds
        for key in ["_id", "student_id", "exam_id", "session_id"]:
            if key in report and not isinstance(report[key], str):
                report[key] = str(report[key])
        
        return report
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/session/{session_id}/pdf")
async def export_report_pdf(session_id: str):
    """Export the report as a server-side generated PDF."""
    try:
        from fastapi.responses import StreamingResponse
        pdf_buffer = await report_service.generate_pdf_report(session_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Report_{session_id}.pdf"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
