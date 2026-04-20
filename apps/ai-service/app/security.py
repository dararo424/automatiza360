"""
Twilio webhook signature validation.

Twilio signs every webhook request with HMAC-SHA1 using the auth token.
The signature is in the X-Twilio-Signature header.

Algorithm:
  1. Start with the full URL of the webhook endpoint
  2. If POST: sort all form params alphabetically, append key+value pairs
  3. Sign with HMAC-SHA1 using the auth token
  4. Compare base64 of result with the header value
"""

from __future__ import annotations

import base64
import hmac
import hashlib
import logging
import os

logger = logging.getLogger(__name__)


def validate_twilio_signature(
    url: str,
    params: dict[str, str],
    signature: str,
    auth_token: str,
) -> bool:
    s = url
    for key in sorted(params.keys()):
        s += key + (params[key] or "")

    mac = hmac.new(auth_token.encode("utf-8"), s.encode("utf-8"), hashlib.sha1)
    computed = base64.b64encode(mac.digest()).decode("utf-8")
    return hmac.compare_digest(computed, signature)


def verify_twilio_request(url: str, params: dict[str, str], signature: str) -> bool:
    """
    Returns True if the request is genuinely from Twilio.
    Falls back to True (permissive) if TWILIO_AUTH_TOKEN is not set,
    logging a warning so we know validation is skipped.
    """
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    if not auth_token:
        logger.warning("TWILIO_AUTH_TOKEN not set — skipping signature validation")
        return True

    if not signature:
        logger.warning("Missing X-Twilio-Signature header — rejecting request")
        return False

    return validate_twilio_signature(url, params, signature, auth_token)
