"""
HTTP client for the NestJS backend.

BackendClient is the per-tenant class that handles JWT auth and all domain
calls.  A module-level cache (_clients) returns the same instance for the
same bot_email so tokens are reused across requests.

Legacy module-level helper functions are kept for backwards compatibility;
they delegate to the first available client in the cache.
"""

from __future__ import annotations

import logging
import os
from urllib.parse import quote_plus

import httpx

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "https://backend-production-1a8c.up.railway.app")

# Cache: bot_email → BackendClient instance
_clients: dict[str, "BackendClient"] = {}


# ── Per-tenant client class ────────────────────────────────────────────────────

class BackendClient:
    def __init__(self, bot_email: str, bot_password: str) -> None:
        self.bot_email = bot_email
        self.bot_password = bot_password
        self._token: str | None = None
        # Populated after the first get_perfil() call
        self.store_name: str = ""
        self.industry: str = ""

    # ── Auth ──────────────────────────────────────────────────────────────────

    async def _login(self) -> None:
        if not self.bot_email or not self.bot_password:
            raise RuntimeError(
                "bot_email and bot_password must be set. "
                "Configure TENANT_CONFIG (or BOT_EMAIL/BOT_PASSWORD) env vars."
            )
        logger.info("Authenticating with backend as %s", self.bot_email)
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": self.bot_email, "password": self.bot_password},
            )
            if not resp.is_success:
                logger.error(
                    "Login failed — status %s, body: %s", resp.status_code, resp.text
                )
            resp.raise_for_status()
        self._token = resp.json()["token"]
        logger.info("Backend authentication successful for %s", self.bot_email)

    async def ping(self) -> bool:
        """Test backend connectivity and pre-populate store info. Returns True on success."""
        try:
            await self._login()
            perfil = await self.get_perfil()
            tenant = (perfil or {}).get("tenant") or {}
            self.store_name = tenant.get("name", "")
            self.industry = tenant.get("industry", "TECH_STORE")
            logger.info(
                "Tenant info loaded for %s: store=%r industry=%s",
                self.bot_email, self.store_name, self.industry,
            )
            return True
        except Exception as exc:
            logger.error("Backend ping failed for %s: %s", self.bot_email, exc)
            return False

    # ── Core request helper ───────────────────────────────────────────────────

    async def _request(self, method: str, path: str, **kwargs) -> dict | list:
        """Authenticated request with a single token-refresh retry on 401."""
        for attempt in range(2):
            if not self._token:
                await self._login()
            headers = {"Authorization": f"Bearer {self._token}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.request(
                    method, f"{BACKEND_URL}{path}", headers=headers, **kwargs
                )
            if resp.status_code == 401 and attempt == 0:
                logger.warning("Token expired for %s, refreshing…", self.bot_email)
                self._token = None
                continue
            if not resp.is_success:
                logger.error(
                    "%s %s failed — status %s, body: %s",
                    method, path, resp.status_code, resp.text,
                )
            resp.raise_for_status()
            return resp.json()
        raise RuntimeError("Authentication failed after retry")

    # ── Domain helpers ────────────────────────────────────────────────────────

    async def get_perfil(self) -> dict:
        result = await self._request("GET", "/auth/perfil")
        return result  # type: ignore[return-value]

    async def get_productos(self) -> list[dict]:
        products: list = await self._request("GET", "/productos")
        return [p for p in products if p.get("active", True)]

    async def buscar_en_proveedores(self, q: str) -> dict:
        result = await self._request("GET", f"/proveedores/buscar?q={quote_plus(q)}")
        return result  # type: ignore[return-value]

    async def buscar_tickets_por_telefono(self, phone: str) -> list[dict]:
        all_tickets: list = await self._request("GET", "/tickets")
        clean = phone.replace("whatsapp:", "").strip()
        return [t for t in all_tickets if clean in t.get("clientPhone", "")]

    async def buscar_ticket_por_numero(self, numero: int) -> dict | None:
        all_tickets: list = await self._request("GET", "/tickets")
        for t in all_tickets:
            if t.get("number") == numero:
                return t
        return None

    async def crear_ticket(self, data: dict) -> dict:
        result = await self._request("POST", "/tickets", json=data)
        return result  # type: ignore[return-value]

    async def crear_cotizacion(self, data: dict) -> dict:
        result = await self._request("POST", "/cotizaciones", json=data)
        return result  # type: ignore[return-value]

    async def crear_orden_bot(self, data: dict) -> dict:
        result = await self._request("POST", "/ordenes/bot", json=data)
        return result  # type: ignore[return-value]

    async def get_menu_dia(self) -> dict | None:
        try:
            result = await self._request("GET", "/menu-dia/hoy")
            return result  # type: ignore[return-value]
        except Exception:
            return None

    async def actualizar_menu_dia(self, platos: list) -> dict:
        result = await self._request("POST", "/menu-dia", json={"platos": platos})
        return result  # type: ignore[return-value]

    # ── Citas (clínica / salón de belleza) ────────────────────────────────────

    async def get_servicios(self) -> list[dict]:
        result = await self._request("GET", "/citas/servicios")
        return result  # type: ignore[return-value]

    async def get_profesionales(self) -> list[dict]:
        result = await self._request("GET", "/citas/profesionales")
        return result  # type: ignore[return-value]

    async def get_disponibilidad(self, date: str, professional_id: str | None = None) -> list[dict]:
        params = f"date={date}"
        if professional_id:
            params += f"&professionalId={professional_id}"
        result = await self._request("GET", f"/citas/disponibilidad?{params}")
        return result  # type: ignore[return-value]

    async def crear_cita(self, data: dict) -> dict:
        result = await self._request("POST", "/citas/bot/crear", json=data)
        return result  # type: ignore[return-value]

    async def cancelar_cita(self, appointment_id: str, client_phone: str) -> dict:
        result = await self._request("PUT", f"/citas/{appointment_id}/cancelar",
                                     json={"clientPhone": client_phone})
        return result  # type: ignore[return-value]

    async def get_citas_cliente(self, phone: str) -> list[dict]:
        result = await self._request("GET", f"/citas/cliente?phone={phone}")
        return result  # type: ignore[return-value]

    # ── Conversaciones (bandeja WhatsApp) ─────────────────────────────────────

    async def ingest_message(
        self,
        client_phone: str,
        body: str,
        direction: str,
        client_name: str | None = None,
    ) -> dict | None:
        """
        Registra un mensaje en la bandeja de conversaciones.
        direction: "INBOUND" | "OUTBOUND"
        Silencia errores para no interrumpir el flujo del bot.
        """
        try:
            payload: dict = {
                "clientPhone": client_phone,
                "body": body,
                "direction": direction,
            }
            if client_name:
                payload["clientName"] = client_name
            result = await self._request("POST", "/conversaciones/ingest", json=payload)
            return result  # type: ignore[return-value]
        except Exception as exc:
            logger.warning("ingest_message failed (%s): %s", direction, exc)
            return None


# ── Client cache ───────────────────────────────────────────────────────────────

def get_client(bot_email: str, bot_password: str) -> BackendClient:
    """Return (and cache) a BackendClient instance for the given credentials."""
    if bot_email not in _clients:
        _clients[bot_email] = BackendClient(bot_email, bot_password)
    return _clients[bot_email]


# ── Legacy module-level helpers (single-tenant compatibility) ──────────────────

def _default_client() -> BackendClient:
    if not _clients:
        raise RuntimeError(
            "No BackendClient instances available. "
            "Set TENANT_CONFIG or BOT_EMAIL/BOT_PASSWORD."
        )
    return next(iter(_clients.values()))


async def ping() -> bool:
    return await _default_client().ping()


async def get_perfil() -> dict:
    return await _default_client().get_perfil()


async def get_productos() -> list[dict]:
    return await _default_client().get_productos()


async def buscar_en_proveedores(q: str) -> dict:
    return await _default_client().buscar_en_proveedores(q)


async def buscar_tickets_por_telefono(phone: str) -> list[dict]:
    return await _default_client().buscar_tickets_por_telefono(phone)


async def buscar_ticket_por_numero(numero: int) -> dict | None:
    return await _default_client().buscar_ticket_por_numero(numero)


async def crear_ticket(data: dict) -> dict:
    return await _default_client().crear_ticket(data)


async def crear_cotizacion(data: dict) -> dict:
    return await _default_client().crear_cotizacion(data)


async def crear_orden_bot(data: dict) -> dict:
    return await _default_client().crear_orden_bot(data)


async def get_menu_dia() -> dict | None:
    return await _default_client().get_menu_dia()


async def buscar_orden_por_numero(numero: int) -> dict | None:
    all_orders: list = await _default_client()._request("GET", "/ordenes")
    for o in all_orders:
        if o.get("number") == numero:
            return o
    return None
