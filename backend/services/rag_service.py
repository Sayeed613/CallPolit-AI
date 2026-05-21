def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks of ~chunk_size words each.

    Args:
        text: The full text to split.
        chunk_size: Number of words per chunk (approximating 500 tokens).
        overlap: Number of overlapping words between chunks.

    Returns:
        List of chunk strings.
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def build_rag_context(chunks: list[dict]) -> str:
    """Build a context string from retrieved chunks for the LLM prompt.

    Args:
        chunks: List of dicts with at least a 'chunk_text' key
                (e.g. from match_chunks RPC result).

    Returns:
        Concatenated context string.
    """
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(f"[{i}] {chunk['chunk_text']}")
    return "\n\n".join(parts)


def detect_escalation(text: str) -> bool:
    """Detect if a customer query should be escalated to a human.

    Returns True if escalation keywords are found.
    NOTE: "agent" is intentionally excluded because the AI calls
    itself "a calling agent" in its greeting, causing false positives.
    """
    triggers = [
        "manager", "complaint", "angry", "not helping",
        "speak to human", "talk to a person",
        "supervisor", "escalate", "frustrated",
        "mujhe kisi aur se baat", "kisi aur se karo",  # Hindi: talk to someone else
    ]
    lower = text.lower()
    return any(trigger in lower for trigger in triggers)
