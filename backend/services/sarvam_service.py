import os
import requests
import base64
import json
from typing import Optional

from config.settings import settings

BASE_URL = "https://api.sarvam.ai"


def text_to_speech(text: str, language: str = "hi", speaker: str = "meera") -> Optional[bytes]:
    """Convert text to speech using Sarvam AI."""
    try:
        if not settings.SARVAM_API_KEY:
            return None

        lang_code_map = {
            "hi": "hi-IN",
            "kn": "kn-IN",
            "ta": "ta-IN",
            "te": "te-IN",
            "ml": "ml-IN",
            "bn": "bn-IN",
            "gu": "gu-IN",
            "mr": "mr-IN",
            "en": "en-IN",
        }

        payload = {
            "inputs": [text],
            "target_language_code": lang_code_map.get(language, "hi-IN"),
            "speaker": speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.0,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": "bulbul:v1",
        }

        headers = {
            "api-subscription-key": settings.SARVAM_API_KEY,
            "Content-Type": "application/json",
        }

        response = requests.post(
            f"{BASE_URL}/v1/text-to-speech",
            json=payload,
            headers=headers,
            timeout=30,
        )

        if response.status_code == 200:
            data = response.json()
            audio_b64 = data.get("audios", [None])[0]
            if audio_b64:
                return base64.b64decode(audio_b64)
        return None
    except Exception as e:
        print(f"Sarvam TTS error: {e}")
        return None


def translate_text(text: str, source_language: str, target_language: str) -> Optional[str]:
    """Translate text between Indian languages using Sarvam AI."""
    try:
        if not settings.SARVAM_API_KEY:
            return None

        payload = {
            "input": text,
            "source_language_code": source_language,
            "target_language_code": target_language,
            "mode": "formal",
            "enable_preprocessing": True,
        }

        headers = {
            "api-subscription-key": settings.SARVAM_API_KEY,
            "Content-Type": "application/json",
        }

        response = requests.post(
            f"{BASE_URL}/v1/translate",
            json=payload,
            headers=headers,
            timeout=30,
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("translated_text", "")
        return None
    except Exception as e:
        print(f"Sarvam translation error: {e}")
        return None
