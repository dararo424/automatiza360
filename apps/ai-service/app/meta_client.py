"""
Meta Graph API client — sends replies to Instagram DMs.
"""

from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)

GRAPH_URL = "https://graph.facebook.com/v19.0"
# Instagram DM text limit is 1000 characters
_MAX_TEXT = 1000


async def send_instagram_message(psid: str, text: str, page_access_token: str) -> bool:
    """
    Send a text reply to an Instagram user (identified by their PSID).

    Args:
        psid:               Page-Scoped User ID — the sender's Instagram ID.
        text:               Message text to send (truncated to 1000 chars if needed).
        page_access_token:  Meta Page Access Token with instagram_manage_messages permission.

    Returns True on success, False on any error.
    """
    if not page_access_token:
        logger.error("send_instagram_message: no page_access_token configured")
        return False

    # Truncate gracefully so we never exceed the API limit
    if len(text) > _MAX_TEXT:
        text = text[: _MAX_TEXT - 3] + "..."

    payload = {
        "recipient": {"id": psid},
        "message": {"text": text},
        "messaging_type": "RESPONSE",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{GRAPH_URL}/me/messages",
                params={"access_token": page_access_token},
                json=payload,
            )
        if r.status_code == 200:
            logger.info("Instagram reply sent to psid=%s", psid)
            return True
        logger.error(
            "Meta API error psid=%s status=%s body=%s", psid, r.status_code, r.text
        )
        return False
    except Exception as exc:
        logger.error("send_instagram_message failed for psid=%s: %s", psid, exc)
        return False
