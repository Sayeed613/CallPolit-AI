from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from services.supabase_client import (
    supabase,
    create_document,
    update_document_status,
    insert_chunk,
    match_chunks,
)
from services.groq_service import get_embedding
from services.rag_service import chunk_text
from services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])


class QueryRequest(BaseModel):
    company_id: str
    question: str


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    company_id: str = Form(...),
    user_id: str = Depends(get_current_user),
):
    """Upload a PDF, extract text, chunk it, embed it, and store vectors.

    Steps:
    1. Save PDF to Supabase Storage bucket "documents" at {company_id}/{filename}
    2. Extract full text using pypdf
    3. Create document record (status="processing")
    4. Split text into chunks (500 tokens, 50 overlap)
    5. Embed and insert each chunk into document_chunks
    6. Update document status to "ready"
    """
    # Ownership check — user must own this company
    from services.supabase_client import verify_company_ownership
    verify_company_ownership(company_id, user_id)

    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Read file bytes
    file_bytes = await file.read()

    # 1. Upload to Supabase Storage
    storage_path = f"{company_id}/{file.filename}"
    try:
        supabase.storage.from_("documents").upload(
            storage_path,
            file_bytes,
            {"content-type": "application/pdf"},
        )
    except Exception as e:
        # If file already exists, overwrite it
        if "Duplicate" in str(e):
            supabase.storage.from_("documents").update(
                storage_path,
                file_bytes,
                {"content-type": "application/pdf"},
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload file to storage: {str(e)}",
            )

    # Get public URL
    file_url = supabase.storage.from_("documents").get_public_url(storage_path)

    # 2. Extract text from PDF using pypdf
    try:
        from pypdf import PdfReader
        import io

        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract text from PDF: {str(e)}",
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted from the PDF",
        )

    # 3. Create document record
    document = create_document(company_id, file.filename, file_url)
    document_id = document["id"]

    try:
        # 4. Chunk the text
        chunks = chunk_text(extracted_text, chunk_size=500, overlap=50)

        # 5. Embed and insert each chunk
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk, prefix="search_document")
            insert_chunk(document_id, company_id, i, chunk, embedding)

        # 6. Update document status to ready
        update_document_status(document_id, "ready", extracted_text)

        return {
            "success": True,
            "document_id": document_id,
            "chunks_created": len(chunks),
            "status": "ready",
        }

    except Exception as e:
        update_document_status(document_id, "failed")
        raise HTTPException(
            status_code=500,
            detail=f"Failed during chunking/embedding: {str(e)}",
        )


@router.post("/query")
async def query_documents(
    req: QueryRequest,
    user_id: str = Depends(get_current_user),
):
    """Given a question, embed it and return top 5 matching chunks."""
    # Ownership check — user must own this company
    from services.supabase_client import verify_company_ownership
    verify_company_ownership(req.company_id, user_id)

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # 1. Embed the question
        query_embedding = get_embedding(req.question)

        # 2. Search for matching chunks
        chunks = match_chunks(query_embedding, req.company_id, match_count=5)

        return {
            "question": req.question,
            "chunks": [
                {
                    "chunk_text": c["chunk_text"],
                    "similarity": float(c["similarity"]),
                }
                for c in chunks
            ],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}",
        )
