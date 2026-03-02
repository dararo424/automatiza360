from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Form, Response
from app.message_handler import handle_message

app = FastAPI(title="Automatiza360 WhatsApp Bot")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/webhook")
async def webhook(
    From: str = Form(...),
    Body: str = Form(default=""),
):
    """Twilio WhatsApp webhook. Returns TwiML with the bot reply."""
    text = Body.strip() or "menu"
    reply = await handle_message(From, text)

    # Escape XML special characters in the reply text
    safe = reply.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{safe}</Message></Response>'
    return Response(content=twiml, media_type="text/xml")
