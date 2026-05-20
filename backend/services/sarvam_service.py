import base64
import httpx
from config.settings import settings

SARVAM_API_KEY = settings.SARVAM_API_KEY


async def text_to_audio(text: str, language: str = "hi-IN") -> bytes:
    """Convert text to speech using Sarvam AI API.

    Args:
        text: The text to convert to speech.
        language: Language code (hi-IN, kn-IN, en-IN).

    Returns:
        Raw audio bytes (WAV format).
    """
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.sarvam.ai/text-to-speech",
            headers={
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "inputs": [text],
                "target_language_code": language,
                "speaker": "meera",
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.5,
                "speech_sample_rate": 8000,
                "enable_preprocessing": True,
                "model": "bulbul:v1",
            },
            timeout=30.0,
        )
        data = r.json()
        return base64.b64decode(data["audios"][0])
