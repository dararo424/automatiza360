import io
import json
import logging
import os
from pathlib import Path

import google.genai as genai

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

_PROMPT = """Analiza el documento y extrae la información del proveedor y TODOS los productos.
Devuelve ÚNICAMENTE un JSON con esta estructura:
{
  "supplier_name": "nombre del proveedor del logo/membrete/encabezado, o null si no se detecta",
  "products": [
    {
      "name": "nombre completo del producto",
      "description": null,
      "sku": "código como OC-001927 o null",
      "cost": precio numérico original,
      "price": cost * 1.10 redondeado al entero
    }
  ]
}
Sin texto extra, sin markdown, sin backticks."""


async def extract_products(content: bytes, filename: str) -> dict:
    ext = Path(filename).suffix.lower()
    if ext in {".xlsx", ".xls"}:
        return await _extract_from_excel(content)
    else:
        return await _extract_from_file(content, filename)


async def _extract_from_excel(content: bytes) -> dict:
    import openpyxl

    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws = wb.active
    rows = []
    for row in ws.iter_rows(values_only=True):
        cells = [str(c) if c is not None else "" for c in row]
        if any(c.strip() for c in cells):
            rows.append("\t".join(cells))
    table_text = "\n".join(rows)

    prompt = f"Datos de la hoja de cálculo:\n\n{table_text}\n\n{_PROMPT}"

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return _parse_response(response.text)


async def _extract_from_file(content: bytes, filename: str) -> dict:
    ext = Path(filename).suffix.lower()
    mime_map = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    mime_type = mime_map.get(ext, "application/octet-stream")

    client = genai.Client(api_key=GEMINI_API_KEY)

    uploaded = await client.aio.files.upload(
        file=io.BytesIO(content),
        config={"mime_type": mime_type, "display_name": filename},
    )
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded, _PROMPT],
        )
    finally:
        try:
            await client.aio.files.delete(name=uploaded.name)
        except Exception as exc:
            logger.warning("Could not delete uploaded file %s: %s", uploaded.name, exc)

    return _parse_response(response.text)


def _parse_response(text: str) -> dict:
    text = text.strip()
    # Strip possible markdown code fences if model ignores instructions
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Gemini returned invalid JSON: %s\nRaw: %s", exc, text[:500])
        return {"supplier_name": None, "products": []}
    if isinstance(data, list):
        return {"supplier_name": None, "products": data}
    if isinstance(data, dict):
        return data
    logger.error("Gemini returned unexpected JSON type: %s", type(data))
    return {"supplier_name": None, "products": []}
