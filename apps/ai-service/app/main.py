from dotenv import load_dotenv
load_dotenv()

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.backend_client import get_client
from app.config import TENANT_CONFIGS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Validate required env vars
    if not os.getenv("GEMINI_API_KEY"):
        logger.error("Missing required environment variable: GEMINI_API_KEY")

    if not TENANT_CONFIGS:
        logger.error(
            "No tenant configuration found. "
            "Set TENANT_CONFIG (JSON array) or BOT_EMAIL + BOT_PASSWORD."
        )

    # 2. Authenticate with the backend and pre-load store info for every tenant
    for cfg in TENANT_CONFIGS:
        client = get_client(cfg.bot_email, cfg.bot_password)
        ok = await client.ping()   # also fetches store_name + industry
        if not ok:
            logger.warning(
                "Backend ping failed for %s (twilio: %s). "
                "Check credentials and BACKEND_URL.",
                cfg.bot_email,
                cfg.twilio_number,
            )

    yield


app = FastAPI(title="Automatiza360 WhatsApp AI Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://automatiza360-frontend.vercel.app",
        "http://localhost:5173",
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    tenants = [
        {"twilio_number": cfg.twilio_number, "bot_email": cfg.bot_email}
        for cfg in TENANT_CONFIGS
    ]
    return {"status": "ok", "tenants": tenants}


@app.post("/import-inventory")
async def import_inventory(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".pdf", ".xlsx", ".xls", ".jpg", ".jpeg", ".png"}:
        raise HTTPException(400, "Formato no soportado")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "Archivo supera 20 MB")
    from app.importer import extract_products
    result = await extract_products(content, file.filename or "file")
    return {"supplier_name": result.get("supplier_name"), "products": result.get("products", [])}


@app.post("/webhook")
async def webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(default=""),
    To: str = Form(default=""),
    MediaUrl0: str = Form(default=""),
    MediaContentType0: str = Form(default=""),
):
    """
    Twilio WhatsApp webhook — receives a message and returns TwiML.

    Twilio sends:
      From:               the customer's WhatsApp number  (e.g. 'whatsapp:+521234567890')
      To:                 the Twilio number that received the message
      Body:               the message text (empty for voice notes)
      MediaUrl0:          URL of the first media attachment (audio/ogg for voice notes)
      MediaContentType0:  MIME type of MediaUrl0 (e.g. 'audio/ogg')
    """
    from app.security import verify_twilio_request
    from app.message_handler import handle_message

    # ── Twilio signature validation ───────────────────────────────────────────
    signature = request.headers.get("X-Twilio-Signature", "")
    # Use WEBHOOK_URL env var if set (needed when Railway proxies change the host)
    webhook_url = os.getenv("WEBHOOK_URL") or str(request.url)
    form_params = {k: v for k, v in (await request.form()).items()}
    if not verify_twilio_request(webhook_url, form_params, signature):
        logger.warning("Invalid Twilio signature from %s", request.client)
        raise HTTPException(status_code=403, detail="Invalid signature")

    to_number = To.replace("whatsapp:", "").strip() or "default"
    media_url: str | None = MediaUrl0.strip() or None
    is_voice = MediaContentType0.startswith("audio/") and bool(media_url)

    # ── Voice note: transcribe and use transcription as the message text ──────
    voice_prefix = ""
    if is_voice:
        from app.voice_service import transcribe_voice_message
        logger.info("Voice note detected from=%s  url=%s", From, media_url)
        try:
            transcription = await transcribe_voice_message(media_url)  # type: ignore[arg-type]
            text = transcription
            voice_prefix = f'🎙️ *Escuché:* "{transcription}"\n\n'
        except Exception as exc:
            logger.error("Voice transcription failed: %s", exc)
            twiml = (
                '<?xml version="1.0" encoding="UTF-8"?>'
                "<Response><Message>No pude procesar tu nota de voz 😔 "
                "¿Podrías escribirlo?</Message></Response>"
            )
            return Response(content=twiml, media_type="text/xml")
    else:
        text = Body.strip() or "hola"

    logger.info(
        "Incoming  from=%s  to=%s  text=%r  media=%s",
        From, to_number, text[:120], media_url or "none",
    )

    reply = await handle_message(From, text, to_number, media_url)
    if voice_prefix:
        reply = voice_prefix + reply
    logger.info("Outgoing  to=%s  text=%r", From, reply[:120])

    safe = reply.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{safe}</Message></Response>"
    )
    return Response(content=twiml, media_type="text/xml")
