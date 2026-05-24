import google.generativeai as genai
from config.settings import settings

genai.configure(api_key=settings.GEMINI_API_KEY)


def generate_response(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 200,
) -> str:
    """Generate a response via Google Gemini.
    Uses gemini-2.5-flash (thinking model, fast enough for voice).
    """
    model = genai.GenerativeModel(
        "gemini-2.5-flash-lite",
        system_instruction=system_prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=0.3,
        ),
    )
    result = model.generate_content(user_message)
    return result.text


def get_embedding(text: str, prefix: str = "search_query") -> list:
    """Get embeddings via Google Gemini API - free tier available.
    Uses gemini-embedding-001 (768-dim).
    prefix: 'search_query' for questions, 'search_document' for chunks.
    """
    task_type = "retrieval_query" if prefix == "search_query" else "retrieval_document"
    prefixed_text = f"{prefix}: {text}"
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=prefixed_text,
        task_type=task_type,
        output_dimensionality=768,
    )
    return result["embedding"]  # 768-dim list of floats
