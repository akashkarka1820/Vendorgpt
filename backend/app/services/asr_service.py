import os
import tempfile
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Global cache for loaded ASR pipelines
_ASR_PIPELINES = {}

TELUGU_MODEL_ID = "vasista22/whisper-telugu-small"
ENGLISH_MODEL_ID = "openai/whisper-small"

def get_asr_pipeline(language: str = "te"):
    global _ASR_PIPELINES
    model_id = TELUGU_MODEL_ID if language == "te" else ENGLISH_MODEL_ID
    if language not in _ASR_PIPELINES:
        print(f"[ASR] Loading model pipeline '{model_id}' for language '{language}'...")
        from transformers import pipeline
        _ASR_PIPELINES[language] = pipeline(
            "automatic-speech-recognition",
            model=model_id
        )
        print(f"[ASR] Model pipeline '{model_id}' loaded successfully.")
    return _ASR_PIPELINES[language], model_id

import traceback

def transcribe_audio_file(file_bytes: bytes, filename: str, language: str = "te") -> Dict[str, Any]:
    """
    Transcribes audio file bytes into text using real Whisper ASR models:
    - Telugu: 'vasista22/whisper-telugu-small'
    - English: 'openai/whisper-small'
    """
    print(f"[PRODUCT-ASR] request received")
    print(f"[PRODUCT-ASR] audio file size: {len(file_bytes)} bytes")
    print(f"[PRODUCT-ASR] language: {language}")

    if not file_bytes:
        print("[PRODUCT-ASR] exception with full traceback: Empty audio file received")
        return {
            "success": False,
            "language": language,
            "transcription": "",
            "error": "Empty audio file received"
        }

    suffix = os.path.splitext(filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_file.write(file_bytes)
        tmp_path = tmp_file.name

    target_audio_path = tmp_path
    converted_path = None

    try:
        # Preprocess audio to 16kHz mono WAV for high ASR accuracy
        try:
            from pydub import AudioSegment
            sound = AudioSegment.from_file(tmp_path)
            sound = sound.set_frame_rate(16000).set_channels(1)
            converted_path = tmp_path + "_16k.wav"
            sound.export(converted_path, format="wav")
            target_audio_path = converted_path
            print(f"[PRODUCT-ASR] audio conversion result: SUCCESS (16kHz Mono WAV, {os.path.getsize(converted_path)} bytes)")
        except Exception as conv_err:
            print(f"[PRODUCT-ASR] audio conversion result: FALLBACK ({conv_err})")

        pipe, model_used = get_asr_pipeline(language)
        print(f"[PRODUCT-ASR] Whisper model used: {model_used}")

        # Run inference
        generate_kwargs = {"task": "transcribe"}
        if language == "te":
            generate_kwargs["language"] = "telugu"
        else:
            generate_kwargs["language"] = "english"

        result = pipe(target_audio_path, generate_kwargs=generate_kwargs)
        transcription_text = result.get("text", "").strip() if isinstance(result, dict) else str(result).strip()

        print(f"[PRODUCT-ASR] transcription: '{transcription_text}'")

        if not transcription_text:
            print("[PRODUCT-ASR] exception with full traceback: Transcription text empty")
            return {
                "success": False,
                "language": language,
                "transcription": "",
                "error": "Could not recognize audio speech clearly."
            }

        return {
            "success": True,
            "language": language,
            "transcription": transcription_text
        }

    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"[PRODUCT-ASR] Inference error:\n{tb}")
        print(f"[PRODUCT-ASR] exception with full traceback:\n{tb}")
        return {
            "success": False,
            "language": language,
            "transcription": "",
            "error": str(e)
        }

    finally:
        for p in [tmp_path, converted_path]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass
