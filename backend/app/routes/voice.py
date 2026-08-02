from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from app.schemas import VoiceTranscribeResponse
from app.services.asr_service import transcribe_audio_file

router = APIRouter(prefix="/api/voice", tags=["Voice"])

@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice(
    file: UploadFile = File(...),
    language: str = Form("te")
):
    """
    Receives audio recording and returns recognized text for Telugu or English.
    Offloads CPU-bound Whisper inference to background threadpool so main event loop never freezes.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No audio file uploaded")

    content = await file.read()
    result = await run_in_threadpool(transcribe_audio_file, content, file.filename or "recording.webm", language)
    return VoiceTranscribeResponse(
        success=result.get("success", False),
        language=result.get("language", language),
        transcription=result.get("transcription", "")
    )
