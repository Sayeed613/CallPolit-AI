import os
from typing import Optional
from google import genai
from config.settings import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


def generate_response(
    system_prompt: str,
    user_message: str,
    model: str = "gemini-2.0-flash",
    temperature: float = 0.3,
    max_output_tokens: int = 512,
) -> str:
    """Generate a response using Gemini."""
    try:
        response = client.models.generate_content(
            model=model,
            contents=[system_prompt, user_message],
            config={
                "temperature": temperature,
                "max_output_tokens": max_output_tokens,
            },
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return ""


def generate_embedding(text: str, model: str = "text-embedding-004") -> list[float]:
    """Generate an embedding vector for the given text."""
    try:
        result = client.models.embed_content(
            model=model,
            contents=text,
        )
        return result.embeddings[0].values if result.embeddings else []
    except Exception as e:
        print(f"Embedding error: {e}")
        return []


def generate_transcript_summary(transcript: list[dict]) -> str:
    """Generate a summary of a call transcript."""
    text = "\n".join(
        [f"{'AI' if t.get('role') == 'assistant' else 'Customer'}: {t.get('content', '')}"
         for t in transcript]
    )
    prompt = f"Summarize this call conversation in 2-3 sentences:\n\n{text}"
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"temperature": 0.2, "max_output_tokens": 200},
        )
        return response.text.strip()
    except Exception:
        return ""
