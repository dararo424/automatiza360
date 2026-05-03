"""
Multi-tenant configuration loaded from environment variables.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass


@dataclass
class TenantConfig:
    twilio_number: str  # e.g. "+15551234567" or "default"
    bot_email: str
    bot_password: str
    instagram_page_id: str = ""        # Meta Page ID — routes Instagram DMs to this tenant
    meta_page_access_token: str = ""   # Page Access Token from Meta Developer Portal


def load_tenant_configs() -> list[TenantConfig]:
    """
    Read TENANT_CONFIG from the environment. Expected JSON format:
    [
      {"twilio_number": "+15551234567", "bot_email": "bot@store1.com", "bot_password": "xxx"},
      {"twilio_number": "+15559876543", "bot_email": "bot@store2.com", "bot_password": "xxx"}
    ]

    Legacy fallback: if TENANT_CONFIG is absent but BOT_EMAIL/BOT_PASSWORD exist,
    wraps them in a single TenantConfig with twilio_number="default".
    """
    raw = os.getenv("TENANT_CONFIG")
    if raw:
        data = json.loads(raw)
        return [TenantConfig(**item) for item in data]

    # Legacy single-tenant fallback
    email = os.getenv("BOT_EMAIL", "")
    password = os.getenv("BOT_PASSWORD", "")
    if email and password:
        return [TenantConfig(twilio_number="default", bot_email=email, bot_password=password)]

    return []


TENANT_CONFIGS: list[TenantConfig] = load_tenant_configs()


def get_tenant_by_instagram_page(page_id: str) -> TenantConfig | None:
    """Return the TenantConfig whose instagram_page_id matches page_id."""
    for cfg in TENANT_CONFIGS:
        if cfg.instagram_page_id == page_id:
            return cfg
    # Fallback: first tenant that has a page access token configured
    for cfg in TENANT_CONFIGS:
        if cfg.meta_page_access_token:
            return cfg
    return TENANT_CONFIGS[0] if TENANT_CONFIGS else None


def get_tenant_config(to_number: str) -> TenantConfig | None:
    """
    Return the TenantConfig whose twilio_number matches to_number.
    Falls back to the "default" entry if present.
    """
    default: TenantConfig | None = None
    for cfg in TENANT_CONFIGS:
        if cfg.twilio_number == to_number:
            return cfg
        if cfg.twilio_number == "default":
            default = cfg
    return default
