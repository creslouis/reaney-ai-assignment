from __future__ import annotations

from typing import Any

import httpx


async def fetch_google_sheet_rows(sheet_id: str, sheet_range: str, api_key: str) -> list[dict[str, Any]]:
    if not api_key:
        return []
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{sheet_range}?key={api_key}"
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
    rows = data.get("values", [])
    if not rows:
        return []
    headers = rows[0]
    return [dict(zip(headers, row)) for row in rows[1:]]
