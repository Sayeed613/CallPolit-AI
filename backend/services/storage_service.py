from services.supabase_client import supabase


def upload_file(bucket: str, path: str, content: bytes, content_type: str) -> str:
    supabase.storage.from_(bucket).upload(
        path=path,
        file=content,
        file_options={"content-type": content_type},
    )
    return supabase.storage.from_(bucket).get_public_url(path)


def delete_file(bucket: str, path: str) -> bool:
    supabase.storage.from_(bucket).remove([path])
    return True


def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    result = supabase.storage.from_(bucket).create_signed_url(path, expires_in)
    if isinstance(result, dict):
        return result.get("signedURL") or result.get("signedUrl") or ""
    return result
