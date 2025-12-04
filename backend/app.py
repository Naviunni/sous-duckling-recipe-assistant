"""FastAPI backend for the AI-assisted recipe assistant."""

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .utils.logging_utils import get_logger
from . import context_manager as ctx
from . import recipe_retrieval as rr
from . import substitution_engine as se
from .llm_interface import ask_llm, generate_recipe, has_llm, modify_recipe
from .intent_parser import parse_intent
from .utils.recipe_utils import normalize_recipe


logger = get_logger(__name__)

app = FastAPI(title="Recipe Assistant API", version="0.1.0")

# Development CORS: allow all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Ingredient(BaseModel):
    name: str
    quantity: Optional[str] = None


class Recipe(BaseModel):
    name: str
    ingredients: List[Ingredient]
    steps: List[str]


class AskRequest(BaseModel):
    message: str = Field(..., description="User message")
    session_id: str = Field(..., description="Client-generated session identifier")


class AskResponse(BaseModel):
    reply: str
    recipe: Optional[Recipe] = None


class SubstituteRequest(BaseModel):
    ingredient: str
    dislikes: Optional[List[str]] = None


class SubstituteResponse(BaseModel):
    substitutes: List[str]


def _respond(session_id: str, reply: str, recipe: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Append assistant message to history and return API response payload."""
    ctx.append_assistant_message(session_id, reply)
    return {"reply": reply, "recipe": recipe}


@app.get("/recipes/{name}", response_model=Recipe)
async def get_recipe(name: str):
    """Fetch a recipe by name from local data."""
    recipe = rr.get_recipe_by_name(name)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@app.post("/substitute", response_model=SubstituteResponse)
async def substitute(req: SubstituteRequest):
    """Suggest substitutes for a given ingredient."""
    subs = se.suggest_substitutes(req.ingredient)
    return {"substitutes": subs}




@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    """Conversational endpoint coordinating retrieval, substitutions, and state.

    - If user asks for a recipe, fetch it, save in session, apply any known dislikes.
    - If user states a dislike or missing ingredient, update session and apply subs to current recipe.
    - Otherwise, return a mock LLM response.
    """
    session_id = req.session_id
    message = req.message.strip()
    if not message:
        return {"reply": "Please type something like 'recipe for lasagna'."}

    # Record user message
    ctx.append_user_message(session_id, message)

    # LLM required: if not available, inform user and return mock response
    if not has_llm():
        return _respond(session_id, "LLM is not available. Please configure OPENAI_API_KEY to enable recipe generation.", None)

    # LLM-based intent parsing and handling only
    history = ctx.get_messages(session_id)
    parsed = parse_intent(message, history)
    intent = parsed.get("intent")

    if intent == "replace":
        current = ctx.get_current_recipe(session_id)
        if not current:
            reply = "Tell me which recipe first (e.g., 'recipe for lasagna')."
            return _respond(session_id, reply, None)
        replacements = parsed.get("replacements", [])
        dislikes = ctx.get_dislikes(session_id)
        for r in replacements:
            src = r.get("src")
            if src:
                dislikes.add(src)
        updated = normalize_recipe(
            modify_recipe(current, list(dislikes), [(r["src"], r["dst"]) for r in replacements if r.get("src") and r.get("dst")], history)
        )
        ctx.set_current_recipe(session_id, updated)
        if replacements:
            first = replacements[0]
            reply = f"Updated the recipe: replaced '{first['src']}' with '{first['dst']}'."
        else:
            reply = "Updated the recipe with requested substitutions."
        return _respond(session_id, reply, updated)

    if intent == "add_dislike":
        dislikes_in = parsed.get("dislikes", [])
        if dislikes_in:
            for d in dislikes_in:
                ctx.add_dislike(session_id, d)
            current = ctx.get_current_recipe(session_id)
            if current:
                regenerated = normalize_recipe(
                    modify_recipe(current, list(ctx.get_dislikes(session_id)), None, history)
                )
                ctx.set_current_recipe(session_id, regenerated)
                reply = "Regenerated the recipe based on your dislikes."
                return _respond(session_id, reply, regenerated)
        return _respond(session_id, "Got it. I'll keep that in mind for substitutions.", None)

    if intent == "get_recipe" and parsed.get("recipe_name"):
        rn = parsed.get("recipe_name")
        generated = normalize_recipe(generate_recipe(rn, list(ctx.get_dislikes(session_id)), history))
        ctx.set_current_recipe(session_id, generated)
        reply = f"Here's a recipe for {generated.get('name', rn)}."
        return _respond(session_id, reply, generated)

    # Smalltalk/unknown → generic LLM reply
    resp = ask_llm(message)
    reply = resp.get("text", "I'm here to help with recipes!")
    return _respond(session_id, reply, None)
