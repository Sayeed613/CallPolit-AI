import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from services.supabase_client import supabase, verify_company_ownership
from services.auth_middleware import get_current_user
from services.gemini_service import generate_embedding
from services.storage_service import upload_file, delete_file

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/list/{company_id}")
async def list_documents(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)
    result = (
        supabase.table("documents")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"documents": result.data}


@router.post("/upload/{company_id}")
@limiter.limit("5/minute")
async def upload_document(
    request: Request,
    company_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)

    # Read file content
    content = await file.read()
    file_size = len(content)
    file_ext = os.path.splitext(file.filename or "document.pdf")[1].lower()

    file_id = str(uuid.uuid4())
    storage_path = f"{company_id}/{file_id}{file_ext}"
    storage_url = upload_file(
        "documents",
        storage_path,
        content,
        file.content_type or "application/pdf",
    )

    # Insert document record
    doc_result = supabase.table("documents").insert({
        "company_id": company_id,
        "filename": f"{file_id}{file_ext}",
        "original_filename": file.filename or "document.pdf",
        "file_size": file_size,
        "mime_type": file.content_type or "application/pdf",
        "status": "processing",
        "storage_path": storage_path,
        "storage_url": storage_url,
    }).execute()

    if not doc_result.data:
        raise HTTPException(status_code=500, detail="Failed to create document record")

    document_id = doc_result.data[0]["id"]

    # Process document - extract text chunks
    try:
        if file_ext == ".pdf":
            from PyPDF2 import PdfReader
            import io

            pdf_reader = PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        elif file_ext == ".txt":
            text = content.decode("utf-8", errors="replace")
        else:
            text = content.decode("utf-8", errors="replace")

        # Split into chunks
        chunks = []
        words = text.split()
        chunk_size = 200
        for i in range(0, len(words), chunk_size):
            chunk_text = " ".join(words[i : i + chunk_size])
            if chunk_text.strip():
                chunks.append(chunk_text)

        # Insert chunks
        chunk_records = []
        for idx, chunk_text in enumerate(chunks):
            chunk_records.append({
                "document_id": document_id,
                "company_id": company_id,
                "chunk_index": idx,
                "content": chunk_text,
            })

        # Insert chunks and generate embeddings
        if chunk_records:
            supabase.table("document_chunks").insert(chunk_records).execute()

            # Generate embeddings (do in background for now)
            for idx, chunk_text in enumerate(chunks[:50]):  # Limit to 50 chunks for speed
                try:
                    embedding = generate_embedding(chunk_text)
                    if embedding:
                        supabase.table("document_chunks").update({
                            "embedding": embedding
                        }).eq("document_id", document_id).eq("chunk_index", idx).execute()
                except Exception as e:
                    logger.error(f"Embedding error for chunk {idx}: {e}")

        # Mark document as ready
        supabase.table("documents").update({
            "status": "ready",
            "chunk_count": len(chunks),
        }).eq("id", document_id).execute()

        return {"document_id": document_id, "chunks": len(chunks)}
    except Exception as e:
        supabase.table("documents").update({
            "status": "failed",
            "error_message": str(e),
        }).eq("id", document_id).execute()
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")


@router.delete("/delete/{document_id}")
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user),
):
    existing = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Document not found")
    verify_company_ownership(existing.data["company_id"], user_id)

    # Delete storage file
    storage_path = existing.data.get("storage_path")
    if storage_path:
        delete_file("documents", storage_path)

    # Delete chunks and document
    supabase.table("document_chunks").delete().eq("document_id", document_id).execute()
    supabase.table("documents").delete().eq("id", document_id).execute()

    return {"success": True}


@router.post("/query/{company_id}")
async def query_documents(
    company_id: str,
    query: str = Form(...),
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)

    from services.rag_service import retrieve_relevant_chunks, build_context

    chunks = retrieve_relevant_chunks(company_id, query)
    context = build_context(chunks)

    return {"context": context, "chunks": chunks}
