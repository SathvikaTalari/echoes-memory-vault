import os
import wave
import numpy as np
import logging
from config import Config

logger = logging.getLogger("echoes.whisper")
_whisper_model = None

def get_whisper_model():
    """Lazily load the Whisper model into memory"""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            model_name = getattr(Config, "WHISPER_MODEL", "base")
            logger.info(f"Loading local Whisper model: '{model_name}'...")
            _whisper_model = whisper.load_model(model_name)
            logger.info("Whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading Whisper model: {e}")
            return None
    return _whisper_model

def read_wav_as_numpy_16k(file_path):
    """
    Read a WAV file directly into a float32 numpy array normalized to [-1.0, 1.0].
    If sample rate is not 16000, perform basic resampling.
    This avoids requiring system ffmpeg for WAV files!
    """
    try:
        with wave.open(file_path, 'rb') as wf:
            num_channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            frame_rate = wf.getframerate()
            num_frames = wf.getnframes()
            
            raw_bytes = wf.readframes(num_frames)
            
            if sample_width == 2:
                audio = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            elif sample_width == 1:
                audio = (np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
            elif sample_width == 4:
                audio = np.frombuffer(raw_bytes, dtype=np.int32).astype(np.float32) / 2147483648.0
            else:
                return None
                
            if num_channels > 1:
                audio = audio.reshape(-1, num_channels).mean(axis=1)
                
            # Basic resampling to 16,000 Hz if needed
            target_sr = 16000
            if frame_rate != target_sr:
                indices = np.round(np.linspace(0, len(audio) - 1, int(len(audio) * target_sr / frame_rate))).astype(int)
                audio = audio[indices]
                
            return audio
    except Exception as e:
        logger.warning(f"Could not parse WAV directly: {e}")
        return None

def transcribe_audio_file(file_path, language=None):
    """
    Transcribes an audio file using local Whisper.
    Returns:
    {
        "success": bool,
        "transcript_raw": str,
        "segments": list of {"start": float, "end": float, "text": str},
        "language": str,
        "engine": str,
        "error": str (optional)
    }
    """
    if not os.path.exists(file_path):
        return {"success": False, "error": "Audio file not found."}

    model = get_whisper_model()
    if model is None:
        # Fallback if whisper package or weights failed
        return {
            "success": True,
            "transcript_raw": "Memory audio recorded and archived. (Local Whisper model is currently unavailable on system path; you can edit or type transcript manually).",
            "segments": [{"start": 0.0, "end": 5.0, "text": "Memory audio recorded and archived."}],
            "language": "en",
            "engine": "fallback"
        }

    try:
        # First attempt: If it's a WAV file, try direct numpy decode to bypass ffmpeg requirement
        audio_np = None
        if file_path.lower().endswith(".wav"):
            audio_np = read_wav_as_numpy_16k(file_path)

        options = {"fp16": False}
        if language:
            options["language"] = language

        if audio_np is not None:
            result = model.transcribe(audio_np, **options)
        else:
            result = model.transcribe(file_path, **options)

        raw_text = result.get("text", "").strip()
        segments = []
        for s in result.get("segments", []):
            segments.append({
                "start": round(float(s.get("start", 0)), 2),
                "end": round(float(s.get("end", 0)), 2),
                "text": s.get("text", "").strip()
            })

        return {
            "success": True,
            "transcript_raw": raw_text,
            "segments": segments,
            "language": result.get("language", "auto"),
            "engine": "local-whisper"
        }
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Whisper transcription error: {err_msg}")
        
        # If ffmpeg is missing error, provide a helpful and graceful recovery
        if "ffmpeg" in err_msg.lower():
            logger.warning("FFmpeg was not detected for non-WAV media. Recommending WAV or FFmpeg install.")
            return {
                "success": False,
                "error": "FFmpeg is required to process non-WAV formats. Please upload or record as WAV, or install ffmpeg on your machine.",
                "engine": "local-whisper-missing-ffmpeg"
            }
            
        return {
            "success": False,
            "error": f"Transcription failed: {err_msg}",
            "engine": "local-whisper"
        }
