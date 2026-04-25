"""
Redis-backed session store with transparent in-memory fallback.

Sessions are keyed by "{to_number}:{phone}" and expire after SESSION_TTL seconds.
If REDIS_URL is not set, all operations are no-ops and the caller falls back to
the in-memory _sessions dict in message_handler.py (single-instance only).

Serialization strategy:
  - session["history"]       → list of {role, content} text pairs
                                (Gemini Content objects can't be JSON-serialized)
  - session["admin_history"] → stored as-is (already plain dicts)
  - session["restored_context"] → stored as-is (plain dicts)

On restore, "history" is loaded back as plain dicts under "restored_context" so
agent.py can rebuild proper Gemini Content objects via _build_history_from_context.
"""

from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)

SESSION_TTL = int(os.getenv("SESSION_TTL_SECONDS", str(60 * 60 * 24)))  # 24h default

_redis: object | None = None
_redis_available: bool | None = None  # None = not checked yet


def _extract_text_history(history: list) -> list[dict]:
    """Serialize Gemini Content objects to [{role, content}] keeping only text turns."""
    result = []
    for turn in history:
        role = getattr(turn, "role", None)
        if role not in ("user", "model"):
            continue
        texts = [
            p.text
            for p in (getattr(turn, "parts", None) or [])
            if getattr(p, "text", None)
        ]
        if texts:
            result.append({"role": role, "content": " ".join(texts)})
    return result


async def _get_redis():
    global _redis, _redis_available

    if _redis_available is False:
        return None
    if _redis is not None:
        return _redis

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        _redis_available = False
        logger.info("REDIS_URL no configurado — historial solo en memoria")
        return None

    try:
        import redis.asyncio as aioredis  # type: ignore

        client = aioredis.from_url(redis_url, decode_responses=True)
        await client.ping()
        _redis = client
        _redis_available = True
        logger.info("Redis conectado correctamente")
        return _redis
    except Exception as exc:
        _redis_available = False
        logger.warning("Redis no disponible (%s) — usando solo memoria", exc)
        return None


async def load_session(key: str) -> dict:
    """Load a session from Redis. Returns {} if not found or Redis unavailable."""
    client = await _get_redis()
    if client is None:
        return {}

    try:
        raw = await client.get(f"session:{key}")
        if not raw:
            return {}

        data: dict = json.loads(raw)

        # "history" was stored as plain dicts → expose as restored_context so
        # agent.py rebuilds proper Gemini Content objects via _build_history_from_context
        if "history" in data:
            data.setdefault("restored_context", data.pop("history"))

        logger.debug("Sesión restaurada desde Redis para key=%s", key)
        return data

    except Exception as exc:
        logger.warning("Error al leer sesión de Redis (key=%s): %s", key, exc)
        return {}


async def save_session(key: str, session: dict) -> None:
    """Persist the current session to Redis."""
    client = await _get_redis()
    if client is None:
        return

    try:
        serializable: dict = {}

        history = session.get("history")
        if history:
            serializable["history"] = _extract_text_history(history)

        admin_history = session.get("admin_history")
        if admin_history:
            serializable["admin_history"] = admin_history

        restored_context = session.get("restored_context")
        if restored_context and "history" not in serializable:
            serializable["restored_context"] = restored_context

        await client.setex(f"session:{key}", SESSION_TTL, json.dumps(serializable))
        logger.debug("Sesión guardada en Redis para key=%s (ttl=%ds)", key, SESSION_TTL)

    except Exception as exc:
        logger.warning("Error al guardar sesión en Redis (key=%s): %s", key, exc)


async def delete_session(key: str) -> None:
    """Remove a session from Redis (used on reset commands)."""
    client = await _get_redis()
    if client is None:
        return

    try:
        await client.delete(f"session:{key}")
        logger.debug("Sesión eliminada de Redis para key=%s", key)
    except Exception as exc:
        logger.warning("Error al eliminar sesión de Redis (key=%s): %s", key, exc)
