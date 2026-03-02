"""HTTP client for the NestJS backend with automatic JWT refresh."""

import os
import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "https://backend-production-1a8c.up.railway.app")
BOT_EMAIL = os.getenv("BOT_EMAIL", "")
BOT_PASSWORD = os.getenv("BOT_PASSWORD", "")

_token: str | None = None


async def _login() -> None:
    global _token
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": BOT_EMAIL, "password": BOT_PASSWORD},
        )
        resp.raise_for_status()
    _token = resp.json()["token"]


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
            _token = None
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError("Authentication failed after retry")


async def buscar_tickets_por_telefono(phone: str) -> list[dict]:
    """Return all open tickets whose clientPhone contains the caller's number."""
    all_tickets: list = await _request("GET", "/tickets")
    # Strip Twilio's "whatsapp:" prefix before comparing
    clean = phone.replace("whatsapp:", "").strip()
    return [t for t in all_tickets if clean in t.get("clientPhone", "")]


async def buscar_ticket_por_numero(numero: int) -> dict | None:
    """Return the ticket with the given sequential number, or None."""
    all_tickets: list = await _request("GET", "/tickets")
    for t in all_tickets:
        if t.get("number") == numero:
            return t
    return None


async def crear_ticket(data: dict) -> dict:
    result = await _request("POST", "/tickets", json=data)
    return result  # type: ignore[return-value]
