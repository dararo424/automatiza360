"""HTTP client for the NestJS backend with automatic JWT refresh."""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "https://backend-production-1a8c.up.railway.app")
BOT_EMAIL = os.getenv("BOT_EMAIL", "")
BOT_PASSWORD = os.getenv("BOT_PASSWORD", "")

_token: str | None = None


async def _login() -> None:
    global _token
    if not BOT_EMAIL or not BOT_PASSWORD:
        raise RuntimeError(
            "BOT_EMAIL and BOT_PASSWORD environment variables are not set. "
            "Create a STAFF user for the bot and configure these variables."
        )
    logger.info("Authenticating with backend as %s", BOT_EMAIL)
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": BOT_EMAIL, "password": BOT_PASSWORD},
        )
        if not resp.is_success:
            logger.error(
                "Login failed — status %s, body: %s", resp.status_code, resp.text
            )
        resp.raise_for_status()
    _token = resp.json()["token"]
    logger.info("Backend authentication successful")


async def ping() -> bool:
    """Test backend connectivity at startup. Returns True on success."""
    try:
        await _login()
        return True
    except Exception as exc:
        logger.error("Backend ping failed: %s", exc)
        return False


async def _request(method: str, path: str, **kwargs) -> dict | list:
    """Authenticated request with a single token-refresh retry on 401."""
    global _token
    for attempt in range(2):
        if not _token:
            await _login()
        headers = {"Authorization": f"Bearer {_token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.request(
                method, f"{BACKEND_URL}{path}", headers=headers, **kwargs
            )
        if resp.status_code == 401 and attempt == 0:
            logger.warning("Token expired, refreshing...")
            _token = None
            continue
        if not resp.is_success:
            logger.error(
                "%s %s failed — status %s, body: %s",
                method, path, resp.status_code, resp.text,
            )
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError("Authentication failed after retry")


# ── Domain helpers ─────────────────────────────────────────────────────────────

async def buscar_tickets_por_telefono(phone: str) -> list[dict]:
    all_tickets: list = await _request("GET", "/tickets")
    clean = phone.replace("whatsapp:", "").strip()
    return [t for t in all_tickets if clean in t.get("clientPhone", "")]


async def buscar_ticket_por_numero(numero: int) -> dict | None:
    all_tickets: list = await _request("GET", "/tickets")
    for t in all_tickets:
        if t.get("number") == numero:
            return t
    return None


async def get_productos() -> list[dict]:
    """Return active products available for quotation."""
    products: list = await _request("GET", "/productos")
    return [p for p in products if p.get("active", True)]


async def crear_ticket(data: dict) -> dict:
    result = await _request("POST", "/tickets", json=data)
    return result  # type: ignore[return-value]


async def crear_cotizacion(data: dict) -> dict:
    result = await _request("POST", "/cotizaciones", json=data)
    return result  # type: ignore[return-value]
