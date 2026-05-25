import json
import logging
from typing import Optional

from services.supabase_client import supabase
from services.gemini_service import generate_embedding

logger = logging.getLogger(__name__)


def retrieve_relevant_chunks(
    company_id: str,
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.3,
) -> list[dict]:
    """Retrieve relevant document chunks using vector similarity search."""
    try:
        query_embedding = generate_embedding(query)
        if not query_embedding:
            return []

        # Use cosine similarity via pgvector
        result = supabase.rpc(
            "match_document_chunks",
            {
                "p_company_id": company_id,
                "p_query_embedding": query_embedding,
                "p_match_threshold": similarity_threshold,
                "p_match_count": top_k,
            },
        ).execute()

        return result.data if result.data else []
    except Exception as e:
        logger.error(f"RAG retrieval error: {e}")
        return []


def build_context(chunks: list[dict]) -> str:
    """Build a context string from retrieved chunks."""
    if not chunks:
        return ""

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        content = chunk.get("content", "").strip()
        score = chunk.get("similarity", 0)
        if content:
            context_parts.append(f"[Document {i}] (relevance: {score:.2f})\n{content}")

    return "\n\n".join(context_parts)


def detect_escalation(text: str) -> bool:
    """Detect if a conversation needs escalation based on keywords."""
    escalation_keywords = [
        "manager", "supervisor", "complaint", "escalate",
        "speak to human", "talk to human", "human agent",
        "frustrated", "angry", "not helpful",
        "legal", "lawsuit", "police",
        "cancel", "terminate",
    ]
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in escalation_keywords)


def detect_sentiment(text: str) -> float:
    """Simple sentiment detection returning a score 0.0-1.0."""
    positive_words = [
        "yes", "okay", "good", "great", "thanks", "thank you",
        "perfect", "excellent", "fine", "sure", "correct",
        "helpful", "appreciate", "happy", "wonderful", "agree",
    ]
    negative_words = [
        "no", "not", "wrong", "bad", "terrible", "awful",
        "frustrated", "angry", "annoyed", "useless", "stupid",
        "hate", "worst", "never", "stop", "don't", "won't",
    ]

    text_lower = text.lower()
    words = text_lower.split()

    if not words:
        return 0.5

    positive_count = sum(1 for w in words if w in positive_words)
    negative_count = sum(1 for w in words if w in negative_words)

    total = positive_count + negative_count
    if total == 0:
        return 0.5

    return min(max(positive_count / total, 0.0), 1.0)
