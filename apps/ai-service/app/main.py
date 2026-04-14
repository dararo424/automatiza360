from dotenv import load_dotenv
load_dotenv()

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
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
    From: str = Form(...),
    Body: str = Form(default=""),
    To: str = Form(default=""),
    MediaUrl0: str = Form(default=""),
):
    """
    Twilio WhatsApp webhook — receives a message and returns TwiML.

    Twilio sends:
      From:       the customer's WhatsApp number  (e.g. 'whatsapp:+521234567890')
      To:         the Twilio number that received the message (e.g. 'whatsapp:+15551234567')
      Body:       the message text
      MediaUrl0:  URL of the first media attachment (image, etc.) — empty if none
    """
    from app.message_handler import handle_message

    text = Body.strip() or "hola"
    # Strip the "whatsapp:" prefix from the To number for tenant lookup
    to_number = To.replace("whatsapp:", "").strip() or "default"
    media_url: str | None = MediaUrl0.strip() or None

    logger.info(
        "Incoming  from=%s  to=%s  text=%r  media=%s",
        From, to_number, text[:120], media_url or "none",
    )

    reply = await handle_message(From, text, to_number, media_url)
    logger.info("Outgoing  to=%s  text=%r", From, reply[:120])

    safe = reply.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{safe}</Message></Response>"
    )
    return Response(content=twiml, media_type="text/xml")
