"""Grocery list utilities: store per-recipe items, aggregate across recipes, and apply overrides."""

from __future__ import annotations

from typing import Dict, List, Any, Optional, Tuple

from .nutrition import resolve_ingredient, parse_quantity_to_grams


def _maybe_strip(s: str) -> str:
    return s.strip() if s else ""


def _compose_quantity(qty: Optional[str], unit: Optional[str]) -> str:
    qty = (qty or "").strip()
    unit = (unit or "").strip()
    return f"{qty} {unit}".strip() if unit else qty


def _normalize_recipes(recipes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure recipes have items list with name/quantity/unit/aisle keys."""
    normalized = []
    for r in recipes or []:
        rname = r.get("name") or "recipe"
        items = []
        for ing in r.get("items") or r.get("ingredients") or []:
            if isinstance(ing, dict):
                items.append({
                    "name": str(ing.get("name") or ing.get("ingredient") or ""),
                    "quantity": str(ing.get("quantity") or ""),
                    "unit": str(ing.get("unit") or ""),
                    "aisle": ing.get("aisle"),
                })
            else:
                items.append({"name": str(ing), "quantity": "", "unit": "", "aisle": None})
        normalized.append({"name": rname, "items": items})
    return normalized


def aggregate_grocery(
    recipes: List[Dict[str, Any]],
    overrides: Optional[Dict[str, Dict[str, Any]]] = None,
    pantry: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Aggregate a list of recipe items into a single grocery view with optional overrides."""
    pantry_set = {(_maybe_strip(p).lower()) for p in (pantry or []) if _maybe_strip(p)}
    overrides = overrides or {}

    agg: Dict[str, Dict[str, Any]] = {}
    for recipe in _normalize_recipes(recipes):
        rname = recipe.get("name") or "recipe"
        for ing in recipe.get("items") or []:
            raw_name = _maybe_strip(ing.get("name") or "")
            qty_text = _compose_quantity(ing.get("quantity"), ing.get("unit"))
            norm, meta = resolve_ingredient(raw_name)
            if norm in pantry_set or raw_name.lower() in pantry_set:
                continue

            grams = parse_quantity_to_grams(qty_text, norm, meta)
            item = agg.setdefault(norm, {
                "name": raw_name or norm,
                "grams": 0.0,
                "aisle": (ing.get("aisle") or (meta.get("aisle") if meta else None)) or "Other",
                "recipes": set(),
                "unknown": False,
                "raw_entries": [],
            })
            item["recipes"].add(rname)
            item["raw_entries"].append({"quantity": qty_text, "name": raw_name})
            if grams is not None:
                item["grams"] += grams
            else:
                item["unknown"] = True

    items_out = []
    for norm, data in agg.items():
        override = overrides.get(norm)
        if override and override.get("remove"):
            continue
        quantity_str = None
        unit = None
        if override and (override.get("quantity") or override.get("unit")):
            quantity_str = (override.get("quantity") or "").strip()
            unit = (override.get("unit") or "").strip() or None
            aisle = override.get("aisle") or data["aisle"]
        else:
            aisle = data["aisle"]
            if data["grams"] > 0:
                quantity_str = f"{round(data['grams'])}"
                unit = "g"
            elif data["raw_entries"]:
                quantity_str = data["raw_entries"][0]["quantity"] or ""
                unit = ""
        items_out.append({
            "name": data["name"],
            "quantity": quantity_str,
            "unit": unit,
            "aisle": aisle,
            "recipes": sorted(list(data["recipes"])),
            "unknown": bool(data["unknown"]),
            "key": norm,
        })

    items_out.sort(key=lambda x: (x["aisle"], x["name"]))
    return {"items": items_out}


def merge_recipe(list_data: Dict[str, Any], recipe: Dict[str, Any]) -> Dict[str, Any]:
    """Upsert a recipe into stored grocery list data."""
    base = {
        "recipes": [r for r in (list_data.get("recipes") or []) if isinstance(r, dict)],
        "overrides": list_data.get("overrides") or {},
    }
    recipes = [r for r in base["recipes"] if _maybe_strip(r.get("name")).lower() != _maybe_strip(recipe.get("name")).lower()]
    recipes.append({"name": recipe.get("name"), "items": recipe.get("items") or []})
    base["recipes"] = recipes
    return base


def remove_recipe(list_data: Dict[str, Any], recipe_name: str) -> Dict[str, Any]:
    base = {
        "recipes": [r for r in (list_data.get("recipes") or []) if isinstance(r, dict)],
        "overrides": list_data.get("overrides") or {},
    }
    recipes = [r for r in base["recipes"] if _maybe_strip(r.get("name")).lower() != _maybe_strip(recipe_name).lower()]
    base["recipes"] = recipes
    return base


def apply_override(list_data: Dict[str, Any], item_key: str, override: Dict[str, Any]) -> Dict[str, Any]:
    base = {
        "recipes": list_data.get("recipes") or [],
        "overrides": list_data.get("overrides") or {},
    }
    clean = {k: v for k, v in override.items() if k in ("quantity", "unit", "aisle", "remove") and v is not None}
    if clean:
        base["overrides"][item_key] = clean
    elif item_key in base["overrides"]:
        del base["overrides"][item_key]
    return base
