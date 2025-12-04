"""Minimal OpenAI (gpt-4o) interface for recipe assistant.

Uses the modern OpenAI SDK (v1+) and returns a simple dict: {"text": ...}.
Falls back to a mock response if the package or API key is missing.
"""

from typing import Dict, Optional, Any
import os
from dotenv import load_dotenv

try:  # keep a small guard for missing package
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover - package not installed
    OpenAI = None  # type: ignore


_client = None
load_dotenv()

def _get_client():
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or OpenAI is None:
        _client = None
        return None
    base_url = os.getenv("OPENAI_BASE_URL")  # optional (Azure/proxy)
    _client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)
    return _client


def ask_llm(
    prompt: str,
    system: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 300,
) -> Dict[str, str]:
    """Query GPT and return a dict with 'text'."""
    prompt = (prompt or "").strip()
    client = _get_client()
    model_name = model or os.getenv("OPENAI_MODEL", "gpt-4o")
    sys_msg = system or "You are a helpful cooking assistant. Answer clearly and succinctly."

    if not client:
        # Clean mock fallback
        text = "I'm here to help with recipes!" if not prompt else (
            f"[Mock LLM] '{prompt[:160]}'. Configure OPENAI_API_KEY to enable real responses."
        )
        return {"text": text}

    try:
        resp = client.chat.completions.create(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": prompt},
            ],
        )
        text = resp.choices[0].message.content if resp.choices else ""
        return {"text": text or ""}
    except Exception as e:  # pragma: no cover - runtime/network errors
        return {"text": f"LLM error: {e}"}


def has_llm() -> bool:
    """Return True if the OpenAI client is available and configured."""
    return _get_client() is not None


def _model_name(override: Optional[str] = None) -> str:
    """Resolve the model name with env default."""
    return override or os.getenv("OPENAI_MODEL", "gpt-4o")


def _parse_json_safe(content: str, fallback: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Parse JSON content, returning fallback on error."""
    import json
    import re
    try:
        return json.loads(content)
    except Exception:
        match = re.search(r"\{.*\}\s*$", content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return fallback or {}


def generate_recipe(recipe_name: str, dislikes: Optional[list] = None, history: Optional[list] = None) -> Dict:
    """Generate a recipe via LLM as structured JSON.

    Returns a dict with keys: name, ingredients (list of {name, quantity}), steps (list[str]).
    Falls back to a minimal stub if LLM unavailable.
    """
    import json

    dislikes = dislikes or []
    client = _get_client()
    if not client:
        # Fallback minimal structure (mock)
        return {
            "name": recipe_name.lower(),
            "ingredients": [
                {"name": "ingredient 1", "quantity": "1 unit"},
                {"name": "ingredient 2", "quantity": "to taste"}
            ],
            "steps": [
                f"Prepare the ingredients for {recipe_name}.",
                "Cook and assemble as appropriate.",
                "Serve warm."
            ]
        }

    system = (
        "You are a helpful cooking assistant. Generate concise, home-cook friendly recipes."
    )
    dislikes_text = ", ".join(dislikes) if dislikes else "none"
    user = (
        "Generate a complete recipe as compact JSON only. Schema: {\n"
        "  \"name\": string,\n"
        "  \"ingredients\": [ { \"name\": string, \"quantity\": string } ],\n"
        "  \"steps\": [ string ]\n"
        "}. Avoid markdown and extra commentary.\n"
        f"Recipe: {recipe_name}. Exclude or replace these if possible: {dislikes_text}."
    )

    try:
        messages = [{"role": "system", "content": system}]
        if history:
            # include a small slice of prior turns to give continuity
            for m in history[-8:]:
                if m.get("role") in ("user", "assistant") and m.get("content"):
                    messages.append({"role": m["role"], "content": m["content"]})
        messages.append({"role": "user", "content": user})

        resp = client.chat.completions.create(
            model=_model_name(),
            temperature=0.3,
            max_tokens=800,
            messages=messages,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content if resp.choices else "{}"
        parsed = _parse_json_safe(content, {"name": recipe_name, "ingredients": [], "steps": []})
        if "name" not in parsed:
            parsed["name"] = recipe_name
        if "ingredients" not in parsed:
            parsed["ingredients"] = []
        if "steps" not in parsed:
            parsed["steps"] = []
        return parsed
    except Exception as e:  # pragma: no cover - runtime/network errors
        return {"name": recipe_name, "ingredients": [], "steps": [f"LLM error: {e}"]}


def chat_json(messages: list, max_tokens: int = 400) -> Dict:
    """Send a chat with response_format json_object and return parsed JSON.

    Returns empty dict if LLM unavailable or parsing fails.
    messages: list of {role: 'system'|'user'|'assistant', content: str}
    """
    import json
    client = _get_client()
    if not client:
        return {}
    try:
        resp = client.chat.completions.create(
            model=_model_name(),
            temperature=0.2,
            max_tokens=max_tokens,
            messages=messages,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content if resp.choices else "{}"
        return _parse_json_safe(content, {})
    except Exception:
        return {}


def modify_recipe(base_recipe: Dict, dislikes: Optional[list] = None, substitutions: Optional[list] = None, history: Optional[list] = None) -> Dict:
    """Modify an existing recipe via LLM given constraints.

    base_recipe: existing recipe JSON (name, ingredients, steps)
    dislikes: list of strings to avoid
    substitutions: list of pairs like [("milk", "oat milk")]
    history: optional chat history (list of {role, content}) for context
    """
    import json

    dislikes = dislikes or []
    substitutions = substitutions or []
    client = _get_client()
    if not client:
        # fallback: just return the base recipe unchanged
        return base_recipe

    system = "You are a helpful cooking assistant. Modify the given recipe JSON to satisfy user constraints without losing structure."
    subs_text = "; ".join([f"{a} -> {b}" for a, b in substitutions]) if substitutions else "none"
    user = (
        "Modify the following recipe JSON to avoid dislikes and apply substitutions, keeping the same JSON schema.\n"
        f"Dislikes: {', '.join(dislikes) if dislikes else 'none'}\n"
        f"Substitutions: {subs_text}\n"
        f"Recipe JSON: {json.dumps(base_recipe, ensure_ascii=False)}"
    )

    messages = [{"role": "system", "content": system}]
    if history:
        for m in history[-8:]:
            if m.get("role") in ("user", "assistant") and m.get("content"):
                messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user})

    try:
        resp = client.chat.completions.create(
            model=_model_name(),
            temperature=0.3,
            max_tokens=900,
            messages=messages,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content if resp.choices else "{}"
        return _parse_json_safe(content, base_recipe)
    except Exception as e:  # pragma: no cover
        return base_recipe
