"""Lightweight nutrition calculator using local ingredient metadata.

Loads macros and densities from data/ingredients.json and computes per-serving
nutrition for a recipe. Designed to be robust to partially specified quantities.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, Tuple, Optional, Any, List

from .logging_utils import get_logger

logger = get_logger(__name__)


# ---------- Ingredient metadata ---------- #

def _ingredients_path() -> Path:
    return Path(__file__).resolve().parent.parent.parent / "data" / "ingredients.json"


@lru_cache(maxsize=1)
def load_ingredient_db() -> Dict[str, Dict[str, Any]]:
    """Load ingredient metadata and normalize keys/aliases."""
    path = _ingredients_path()
    if not path.exists():
        logger.warning("ingredients.json not found; nutrition will be unavailable")
        return {}
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # pragma: no cover - runtime safety
        logger.warning("Failed to read ingredients.json: %s", exc)
        return {}

    db: Dict[str, Dict[str, Any]] = {}
    for base_name, meta in raw.items():
        if not isinstance(meta, dict):
            continue
        key = base_name.strip().lower()
        meta["_canonical"] = key
        db[key] = meta
        for alias in meta.get("aliases") or []:
            if not alias:
                continue
            a_key = str(alias).strip().lower()
            db[a_key] = meta
    return db


def resolve_ingredient(name: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Return (canonical_name, metadata) if known, else (normalized_name, None)."""
    key = (name or "").strip().lower()
    db = load_ingredient_db()
    meta = db.get(key)
    if meta:
        return meta.get("_canonical", key), meta
    # best-effort: match contains
    for k, m in db.items():
        if k in key:
            return m.get("_canonical", k), m
    return key, None


# ---------- Quantity parsing ---------- #

_UNIT_MAP = {
    "g": "g",
    "gram": "g",
    "grams": "g",
    "kg": "kg",
    "kilogram": "kg",
    "kilograms": "kg",
    "mg": "mg",
    "milligram": "mg",
    "milligrams": "mg",
    "ml": "ml",
    "milliliter": "ml",
    "milliliters": "ml",
    "l": "l",
    "liter": "l",
    "liters": "l",
    "cup": "cup",
    "cups": "cup",
    "tbsp": "tbsp",
    "tablespoon": "tbsp",
    "tablespoons": "tbsp",
    "tbsps": "tbsp",
    "tsp": "tsp",
    "teaspoon": "tsp",
    "teaspoons": "tsp",
    "tsps": "tsp",
    "oz": "oz",
    "ounce": "oz",
    "ounces": "oz",
    "lb": "lb",
    "lbs": "lb",
    "pound": "lb",
    "pounds": "lb",
    "clove": "clove",
    "cloves": "clove",
    "can": "can",
    "cans": "can",
    "slice": "slice",
    "slices": "slice",
    "piece": "piece",
    "pieces": "piece",
}


def _parse_number(token: str) -> Optional[float]:
    """Parse numbers like '1', '1.5', '1/2', '1 1/2'."""
    token = token.strip()
    if not token:
        return None
    # mixed number "1 1/2"
    if " " in token:
        parts = token.split()
        total = 0.0
        for p in parts:
            try:
                total += float(p)
                continue
            except ValueError:
                pass
            if "/" in p:
                try:
                    num, den = p.split("/", 1)
                    total += float(num) / float(den)
                except Exception:
                    return None
        return total if total > 0 else None
    # fraction "1/2"
    if "/" in token:
        try:
            num, den = token.split("/", 1)
            return float(num) / float(den)
        except Exception:
            return None
    try:
        return float(token)
    except ValueError:
        return None


def parse_quantity_to_grams(quantity: str, name: str, meta: Optional[Dict[str, Any]]) -> Optional[float]:
    """Convert a freeform quantity string to grams using densities when available."""
    if not quantity:
        return None
    qty = quantity.lower().strip()
    # quick path: detect simple numbers with units
    match = re.match(r"([0-9./\s]+)\s*([a-zA-Z]+)?", qty)
    amount = _parse_number(match.group(1)) if match else None
    unit_token = (match.group(2).lower() if match and match.group(2) else "").strip()
    unit = _UNIT_MAP.get(unit_token, unit_token or "")

    if amount is None:
        return None

    # mass units
    if unit in ("g", ""):
        if unit == "" and meta and meta.get("count_g"):
            return amount * float(meta["count_g"])
        return amount
    if unit == "mg":
        return amount / 1000.0
    if unit == "kg":
        return amount * 1000.0
    if unit == "oz":
        return amount * 28.3495
    if unit == "lb":
        return amount * 453.592

    # count-based items (eggs, cloves)
    if unit in ("clove", "slice", "piece", "can") or "whole" in qty:
        if meta and meta.get("count_g"):
            return amount * float(meta["count_g"])
        return None

    # volume → grams via density
    density = None
    if meta and meta.get("density_g_per_cup"):
        density = float(meta["density_g_per_cup"])
    elif meta and meta.get("count_g"):
        density = float(meta["count_g"])  # last-resort approximation
    else:
        density = 240.0  # approximate water density per cup

    if unit == "cup":
        return amount * density
    if unit == "tbsp":
        return amount * (density / 16.0)
    if unit == "tsp":
        return amount * (density / 48.0)
    if unit == "ml":
        return amount * (density / 240.0)
    if unit == "l":
        return amount * (density / 0.24)

    return None


# ---------- Nutrition computation ---------- #

def compute_recipe_nutrition(recipe: Dict[str, Any]) -> Tuple[Dict[str, str], List[str]]:
    """Return (nutrition_per_serving, unknown_items)."""
    ingredients = recipe.get("ingredients") or []
    servings = recipe.get("servings") or 1
    try:
        servings = max(1, int(servings))
    except Exception:
        servings = 1

    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0}
    unknown: List[str] = []

    for ing in ingredients:
        if isinstance(ing, dict):
            raw_name = str(ing.get("name") or ing.get("ingredient") or "")
            qty = str(ing.get("quantity") or "")
        else:
            raw_name = str(ing)
            qty = ""
        norm_name, meta = resolve_ingredient(raw_name)
        grams = parse_quantity_to_grams(qty, norm_name, meta)
        if not meta or grams is None:
            unknown.append(raw_name)
            continue
        per_100 = meta.get("per_100g") or {}
        factor = grams / 100.0
        for k in totals.keys():
            try:
                totals[k] += float(per_100.get(k, 0)) * factor
            except Exception:
                continue

    per_serving = {k: (v / servings) for k, v in totals.items()}

    def fmt(val: float, unit: str) -> str:
        return f"{round(val)} {unit}"

    nutrition_out = {
        "calories": fmt(per_serving["calories"], "kcal"),
        "protein": fmt(per_serving["protein"], "g"),
        "carbs": fmt(per_serving["carbs"], "g"),
        "fat": fmt(per_serving["fat"], "g"),
        "fiber": fmt(per_serving["fiber"], "g"),
    }
    return nutrition_out, unknown


def annotate_recipe_nutrition(recipe: Dict[str, Any]) -> Dict[str, Any]:
    """Return recipe with nutrition computed/augmented."""
    if not recipe:
        return recipe
    nutrition, unknown = compute_recipe_nutrition(recipe)
    out = dict(recipe)
    out["nutrition"] = nutrition
    if unknown:
        out["nutrition_unknown_items"] = unknown
    return out
