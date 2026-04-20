"""
WhatsApp voice message transcription via OpenAI Whisper.

Downloads the OGG audio file from Twilio (requires Basic auth) and
transcribes it using the Whisper API with Spanish as the target language.
"""

from __future__ import annotations

import io
import logging
import os

import httpx
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_openai: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai


async def transcribe_voice_message(media_url: str) -> str:
    """
    Download a Twilio voice note and return the Spanish transcription.

    Raises an exception if download or transcription fails — caller should
    handle and fall back to a friendly error message.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            media_url,
            auth=(account_sid, auth_token),
            follow_redirects=True,
        )
        response.raise_for_status()
        audio_bytes = response.content

    logger.info("Downloaded voice note: %d bytes from %s", len(audio_bytes), media_url)

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "voice.ogg"

    result = await _get_openai().audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="es",
    )

    transcription = result.text.strip()
    logger.info("Transcription: %r", transcription[:200])
    return transcription
