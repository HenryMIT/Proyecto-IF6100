from fastapi import HTTPException, UploadFile
import os
import uuid
from pathlib import Path
from typing import List, Optional


class FileUploadManager:
    """Utility simple para subir imágenes a uploads/"""
    def __init__(self, base_upload_dir: str = "uploads"):
        self.base_upload_dir = Path(base_upload_dir)
        self.base_upload_dir.mkdir(exist_ok=True)

    def _clean_filename(self, filename: str) -> str:
        if not filename:
            return "archivo"
        clean = filename.replace(" ", "_")
        clean = clean.replace("(", "").replace(")", "")
        clean = clean.replace("[", "").replace("]", "")
        clean = clean.replace("{", "").replace("}", "")
        clean = clean.replace("&", "and").replace("%", "pct")
        return clean

    def upload_image(self, file: UploadFile, max_size_mb: int = 5) -> dict:
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no permitido. Use: {', '.join(allowed_types)}"
            )
        file.file.seek(0)
        content = file.file.read()
        max_size_bytes = max_size_mb * 1024 * 1024
        if len(content) > max_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"Archivo muy grande. Máximo: {max_size_mb}MB"
            )
        original_name = file.filename
        clean_name = self._clean_filename(original_name)
        name_without_ext = Path(clean_name).stem
        file_extension = Path(clean_name).suffix
        unique_filename = f"{name_without_ext}{file_extension}"
        file_path = self.base_upload_dir / unique_filename
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        image_url = f"/uploads/{unique_filename}"
        return {
            "message": "Archivo subido exitosamente",
            "original_filename": original_name,
            "stored_filename": unique_filename,
            "image_url": image_url,
            "file_size": len(content)
        }

    def delete_file(self, image_url: str) -> bool:
        """
        Elimina un archivo dado su URL relativa (ej: /uploads/imagen.jpg)
        Retorna True si se eliminó exitosamente, False si no existía
        """
        try:
            # Extraer solo el nombre del archivo de la URL
            # Si viene "/uploads/imagen.jpg" -> "imagen.jpg"
            if image_url.startswith("/uploads/"):
                filename = image_url.replace("/uploads/", "")
            else:
                filename = image_url

            file_path = self.base_upload_dir / filename

            # Verificar si el archivo existe
            if file_path.exists() and file_path.is_file():
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error al eliminar archivo {image_url}: {e}")
            return False

# Instancia global del manager
file_manager = FileUploadManager()