"""Recipe-related utilities."""

from typing import Dict, Any, List


def normalize_recipe(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a recipe-like dict into the API schema.

    Ensures keys: name (str), ingredients (list[{name, quantity}]), steps (list[str]),
    optional nutrition (dict[str, str]) and serving_size (str).
    Tolerates alternative keys and mixed types.
    """
    name = str((data or {}).get("name", "recipe")).strip() or "recipe"
    raw_ings = (data or {}).get("ingredients", []) or []
    ingredients: List[Dict[str, str]] = []
    for it in raw_ings:
        if isinstance(it, dict):
            n = it.get("name") or it.get("ingredient") or it.get("item") or "ingredient"
            q = it.get("quantity") or it.get("qty") or ""
            ingredients.append({"name": str(n), "quantity": str(q) if q is not None else ""})
        elif isinstance(it, str):
            ingredients.append({"name": it, "quantity": ""})
    raw_steps = (data or {}).get("steps", [])
    if isinstance(raw_steps, str):
        steps = [s.strip() for s in raw_steps.split("\n") if s.strip()]
    else:
        steps = [str(s) for s in (raw_steps or [])]
    raw_nutrition = (data or {}).get("nutrition") or {}
    nutrition: Dict[str, str] = {}
    if isinstance(raw_nutrition, dict):
        for k, v in raw_nutrition.items():
            key = str(k).strip() if k is not None else ""
            if not key:
                continue
            if isinstance(v, (int, float)):
                val = f"{v}"
            elif v is None:
                continue
            else:
                val = str(v).strip()
            if val:
                nutrition[key] = val
    serving_size = (
        (data or {}).get("serving_size")
        or (data or {}).get("servingSize")
        or (data or {}).get("nutrition", {}).get("serving_size")
        or (data or {}).get("nutrition", {}).get("servingSize")
    )
    serving_size = str(serving_size).strip() if serving_size else None

    return {
        "name": name,
        "ingredients": ingredients,
        "steps": steps,
        "nutrition": nutrition or None,
        "serving_size": serving_size or None,
    }
