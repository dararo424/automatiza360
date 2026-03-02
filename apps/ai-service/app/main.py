from dotenv import load_dotenv
load_dotenv()

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Form, Response

from app.backend_client import get_perfil, ping
from app.agent import set_store_name

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Validate required env vars
    missing = [v for v in ("GEMINI_API_KEY", "BOT_EMAIL", "BOT_PASSWORD") if not os.getenv(v)]
    if missing:
        logger.error("Missing required environment variables: %s", ", ".join(missing))

    # 2. Authenticate with the NestJS backend
    ok = await ping()
    if not ok:
        logger.warning(
            "Backend authentication failed on startup. "
            "Check BOT_EMAIL, BOT_PASSWORD and BACKEND_URL."
        )

    # 3. Fetch store name from the bot's tenant profile (unless overridden by env var)
    if ok and not os.getenv("BOT_STORE_NAME"):
        try:
            perfil = await get_perfil()
            store_name = (perfil.get("tenant") or {}).get("name", "")
            if store_name:
                set_store_name(store_name)
                logger.info("Store name loaded from backend: %s", store_name)
        except Exception as exc:
            logger.warning("Could not fetch store name from backend: %s", exc)
    elif os.getenv("BOT_STORE_NAME"):
        set_store_name(os.getenv("BOT_STORE_NAME"))  # type: ignore[arg-type]

    yield


app = FastAPI(title="Automatiza360 WhatsApp AI Agent", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/webhook")
async def webhook(
    From: str = Form(...),
    Body: str = Form(default=""),
):
    """Twilio WhatsApp webhook — receives a message and returns TwiML."""
    from app.message_handler import handle_message

    text = Body.strip() or "hola"
    logger.info("Incoming  from=%s  text=%r", From, text[:120])

    reply = await handle_message(From, text)
    logger.info("Outgoing  to=%s  text=%r", From, reply[:120])

    safe = reply.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{safe}</Message></Response>"
    )
    return Response(content=twiml, media_type="text/xml")
