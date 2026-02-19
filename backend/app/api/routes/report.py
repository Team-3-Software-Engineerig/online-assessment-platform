from fastapi import APIRouter, HTTPException
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/session/{session_id}")
async def get_report(session_id: str):
    """Get the report for a specific exam session."""
    try:
        report = await report_service.get_report_by_session(session_id)
        if not report:
            # If report doesn't exist, calculate it (for just-finished exams)
            report = await report_service.calculate_score(session_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
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
