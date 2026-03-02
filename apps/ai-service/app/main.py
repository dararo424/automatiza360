from dotenv import load_dotenv
load_dotenv()

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Form, Response

from app.backend_client import ping

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ok = await ping()
    if not ok:
        logger.warning(
            "Could not authenticate with backend on startup. "
            "Check BOT_EMAIL, BOT_PASSWORD and BACKEND_URL env vars. "
            "Bot will return error messages until backend is reachable."
        )
    yield


app = FastAPI(title="Automatiza360 WhatsApp Bot", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/webhook")
async def webhook(
    From: str = Form(...),
    Body: str = Form(default=""),
):
    """Twilio WhatsApp webhook. Receives a message and returns TwiML."""
    # Import here to avoid circular import at module load time
    from app.message_handler import handle_message

    text = Body.strip() or "menu"
    logger.info("Incoming from %s: %r", From, text[:80])

    reply = await handle_message(From, text)

    safe = reply.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{safe}</Message></Response>"
    )
    return Response(content=twiml, media_type="text/xml")
