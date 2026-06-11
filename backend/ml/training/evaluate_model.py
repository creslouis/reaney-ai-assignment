from __future__ import annotations

import json
from pathlib import Path


def read_model_report() -> dict:
    metadata_path = Path("ml/models/model_metadata.json")
    if not metadata_path.exists():
        return {"ready": False}
    return {"ready": True, **json.loads(metadata_path.read_text(encoding="utf-8"))}
