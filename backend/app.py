"""FastAPI backend for the AI-assisted recipe assistant."""

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from .database import async_session
from .models import User, UserProfile, SavedRecipe, GroceryList
from .utils.auth_utils import hash_password, verify_password, make_token, verify_token

from .utils.logging_utils import get_logger
from . import context_manager as ctx
from . import recipe_retrieval as rr
from . import substitution_engine as se
from .llm_interface import ask_llm, generate_recipe, has_llm, modify_recipe
from .intent_parser import parse_intent
from .utils.recipe_utils import normalize_recipe
from .utils.nutrition import annotate_recipe_nutrition
from .utils.grocery import aggregate_grocery, merge_recipe, remove_recipe, apply_override


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
    nutrition: Optional[Dict[str, str]] = None
    serving_size: Optional[str] = None


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


class NutritionPreviewRequest(BaseModel):
    recipe: Recipe


class NutritionPreviewResponse(BaseModel):
    nutrition: Dict[str, str]
    unknown_items: Optional[List[str]] = None


class GroceryRecipe(BaseModel):
    name: str
    ingredients: List[Ingredient]
    steps: List[str]
    nutrition: Optional[Dict[str, str]] = None
    serving_size: Optional[str] = None


class GroceryRequest(BaseModel):
    recipes: List[GroceryRecipe]
    pantry: Optional[List[str]] = None


class GroceryItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    aisle: Optional[str] = None
    recipes: Optional[List[str]] = None
    unknown: Optional[bool] = None
    key: Optional[str] = None


class GroceryResponse(BaseModel):
    items: List[GroceryItem]
    recipes: Optional[List[str]] = None


class GrocerySaveRequest(BaseModel):
    items: List[GroceryItem]
    recipes: Optional[List[str]] = None


class GroceryRecipeItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    aisle: Optional[str] = None


class GroceryRecipePayload(BaseModel):
    name: str
    items: List[GroceryRecipeItem]


class GroceryFullResponse(BaseModel):
    recipes: List[GroceryRecipePayload]
    aggregated: GroceryResponse


class GroceryItemOverride(BaseModel):
    key: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    aisle: Optional[str] = None
    remove: Optional[bool] = None


def _respond(session_id: str, reply: str, recipe: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Append assistant message to history and return API response payload."""
    ctx.append_assistant_message(session_id, reply)
    return {"reply": reply, "recipe": recipe}


# ===== Auth models & routes =====

class AuthRequest(BaseModel):
    email: str
    password: str


class AuthProfile(BaseModel):
    id: str
    email: str
    name: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    profile: AuthProfile


def _profile_from_user(u: User) -> Dict[str, Any]:
    name = (u.email.split("@")[0] if u.email and "@" in u.email else u.email) or "User"
    return {"id": str(u.user_id), "email": u.email, "name": name}


@app.post("/auth/signup", response_model=AuthResponse)
async def signup(req: AuthRequest):
    email = (req.email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    async with async_session() as db:
        exists = await db.execute(select(User).where(User.email == email))
        if exists.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="Email already registered")
        u = User(email=email, password_hash=hash_password(req.password))
        db.add(u)
        # create a default profile
        await db.flush()
        db.add(UserProfile(user_id=u.user_id))
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=409, detail="Email already registered")

        token = make_token(u.user_id)
        return {"token": token, "profile": _profile_from_user(u)}


@app.post("/auth/login", response_model=AuthResponse)
async def login(req: AuthRequest):
    email = (req.email or "").strip().lower()
    if not email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    async with async_session() as db:
        res = await db.execute(select(User).where(User.email == email))
        u = res.scalar_one_or_none()
        if u is None or not verify_password(req.password, u.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = make_token(u.user_id)
        return {"token": token, "profile": _profile_from_user(u)}


class ProfilePayload(BaseModel):
    allergies: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    disliked_ingredients: Optional[List[str]] = None
    skill_level: Optional[str] = None


def _require_user_id(request: Request):
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth.split(" ", 1)[1]
    uid = verify_token(token)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    return uid


async def _load_profile(user_id) -> Dict[str, Any]:
    async with async_session() as db:
        p_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        p = p_res.scalar_one_or_none()
        if not p:
            return {"allergies": [], "dietary_restrictions": [], "disliked_ingredients": [], "skill_level": None}
        return {
            "allergies": p.allergies or [],
            "dietary_restrictions": p.dietary_restrictions or [],
            "disliked_ingredients": p.disliked_ingredients or [],
            "skill_level": p.skill_level,
        }


class FullProfile(AuthProfile):
    allergies: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    disliked_ingredients: Optional[List[str]] = None
    skill_level: Optional[str] = None


@app.get("/me/profile", response_model=FullProfile)
async def get_my_profile(request: Request):
    user_id = _require_user_id(request)
    async with async_session() as db:
        u_res = await db.execute(select(User).where(User.user_id == user_id))
        u = u_res.scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        p_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        p = p_res.scalar_one_or_none()
        prof = _profile_from_user(u)
        prof.update({
            "allergies": p.allergies if p else [],
            "dietary_restrictions": p.dietary_restrictions if p else [],
            "disliked_ingredients": p.disliked_ingredients if p else [],
            "skill_level": p.skill_level if p else None,
        })
        return prof


@app.post("/me/profile")
async def upsert_my_profile(payload: ProfilePayload, request: Request):
    user_id = _require_user_id(request)
    async with async_session() as db:
        res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        prof = res.scalar_one_or_none()
        if not prof:
            prof = UserProfile(user_id=user_id)
            db.add(prof)
        # Normalize inputs; always set, defaulting to []/None to avoid stale/null values
        prof.allergies = [a.strip() for a in (payload.allergies or []) if a and a.strip()]
        prof.dietary_restrictions = [d.strip() for d in (payload.dietary_restrictions or []) if d and d.strip()]
        prof.disliked_ingredients = [d.strip() for d in (payload.disliked_ingredients or []) if d and d.strip()]
        prof.skill_level = (payload.skill_level.strip() if payload.skill_level else None)
        await db.commit()
        return {"ok": True}


# ===== Saved recipes (per user) =====

class SavedRecipePayload(BaseModel):
    name: str
    ingredients: List[Ingredient]
    steps: List[str]
    nutrition: Optional[Dict[str, str]] = None
    serving_size: Optional[str] = None


@app.get("/me/saved")
async def list_my_saved(request: Request):
    user_id = _require_user_id(request)
    async with async_session() as db:
        res = await db.execute(select(SavedRecipe).where(SavedRecipe.user_id == user_id).order_by(SavedRecipe.saved_at.desc()))
        rows = res.scalars().all()
        out = []
        for r in rows:
            data = r.recipe_data or {}
            data["savedAt"] = (r.saved_at.isoformat() if r.saved_at else None)
            out.append(data)
        return out


@app.post("/me/saved")
async def save_my_recipe(payload: SavedRecipePayload, request: Request):
    user_id = _require_user_id(request)
    async with async_session() as db:
        # Upsert by (user_id, recipe_title)
        res = await db.execute(
            select(SavedRecipe).where(
                SavedRecipe.user_id == user_id,
                SavedRecipe.recipe_title == payload.name,
            )
        )
        existing = res.scalar_one_or_none()
        if existing:
            existing.recipe_data = payload.model_dump()
        else:
            db.add(SavedRecipe(user_id=user_id, recipe_title=payload.name, recipe_data=payload.model_dump()))
        await db.commit()
        return {"ok": True}


@app.delete("/me/saved")
async def delete_my_saved(name: str, request: Request):
    user_id = _require_user_id(request)
    async with async_session() as db:
        res = await db.execute(
            select(SavedRecipe).where(
                SavedRecipe.user_id == user_id,
                SavedRecipe.recipe_title == name,
            )
        )
        existing = res.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="Not found")
        await db.delete(existing)
        await db.commit()
        return {"ok": True}


# Load a saved recipe into a chat session so user can continue chatting
class LoadChatRequest(BaseModel):
    session_id: str
    recipe: Recipe


@app.post("/chat/load")
async def chat_load(req: LoadChatRequest, request: Request):
    # Optional: apply auth/profile dislikes just like /ask
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        uid = verify_token(auth.split(" ", 1)[1])
        if uid:
            profile = await _load_profile(uid)
            sess = ctx.get_or_create_session(req.session_id)
            if not sess.get("profile_applied"):
                for item in (profile.get("allergies") or []) + (profile.get("disliked_ingredients") or []):
                    if item:
                        ctx.add_dislike(req.session_id, str(item))
                sess["profile_applied"] = True

    # Set current recipe
    data = req.recipe.dict()
    ctx.set_current_recipe(req.session_id, normalize_recipe(data))
    # Also append a friendly assistant message
    ctx.append_assistant_message(req.session_id, f"Loaded your saved recipe for {data.get('name','')}.")
    return {"ok": True, "recipe": data}


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


@app.post("/nutrition/preview", response_model=NutritionPreviewResponse)
async def nutrition_preview(req: NutritionPreviewRequest):
    data = annotate_recipe_nutrition(req.recipe.model_dump())
    return {
        "nutrition": data.get("nutrition") or {},
        "unknown_items": data.get("nutrition_unknown_items") or None,
    }


@app.post("/grocery", response_model=GroceryResponse)
async def grocery(req: GroceryRequest):
    data = aggregate_grocery([r.model_dump() for r in req.recipes], pantry=req.pantry)
    return data


def _default_grocery_data() -> Dict[str, Any]:
    return {"recipes": [], "overrides": {}}


async def _load_grocery_data(user_id):
    async with async_session() as db:
        res = await db.execute(select(GroceryList).where(GroceryList.user_id == user_id))
        row = res.scalar_one_or_none()
        if not row or not row.list_data:
            return _default_grocery_data()
        return row.list_data


async def _save_grocery_data(user_id, data: Dict[str, Any]):
    async with async_session() as db:
        res = await db.execute(select(GroceryList).where(GroceryList.user_id == user_id))
        row = res.scalar_one_or_none()
        if row:
            row.list_data = data
        else:
            db.add(GroceryList(user_id=user_id, list_data=data))
        await db.commit()


@app.get("/me/grocery", response_model=GroceryFullResponse)
async def get_my_grocery(request: Request):
    user_id = _require_user_id(request)
    data = await _load_grocery_data(user_id)
    aggregated = aggregate_grocery(data.get("recipes", []), overrides=data.get("overrides", {}))
    aggregated["recipes"] = [r.get("name") for r in data.get("recipes", [])]
    return {"recipes": data.get("recipes", []), "aggregated": aggregated}


@app.post("/me/grocery/recipe", response_model=GroceryFullResponse)
async def upsert_grocery_recipe(req: GroceryRecipePayload, request: Request):
    user_id = _require_user_id(request)
    current = await _load_grocery_data(user_id)
    updated = merge_recipe(current, req.model_dump())
    await _save_grocery_data(user_id, updated)
    aggregated = aggregate_grocery(updated.get("recipes", []), overrides=updated.get("overrides", {}))
    aggregated["recipes"] = [r.get("name") for r in updated.get("recipes", [])]
    return {"recipes": updated.get("recipes", []), "aggregated": aggregated}


@app.delete("/me/grocery/recipe")
async def delete_grocery_recipe(name: str, request: Request):
    user_id = _require_user_id(request)
    current = await _load_grocery_data(user_id)
    updated = remove_recipe(current, name)
    await _save_grocery_data(user_id, updated)
    aggregated = aggregate_grocery(updated.get("recipes", []), overrides=updated.get("overrides", {}))
    aggregated["recipes"] = [r.get("name") for r in updated.get("recipes", [])]
    return {"recipes": updated.get("recipes", []), "aggregated": aggregated}


@app.patch("/me/grocery/item", response_model=GroceryFullResponse)
async def override_grocery_item(payload: GroceryItemOverride, request: Request):
    user_id = _require_user_id(request)
    current = await _load_grocery_data(user_id)
    from .utils.grocery import _maybe_strip  # reuse normalization helper
    key = _maybe_strip(payload.key).lower()
    updated = apply_override(current, key, payload.model_dump(exclude_none=True))
    await _save_grocery_data(user_id, updated)
    aggregated = aggregate_grocery(updated.get("recipes", []), overrides=updated.get("overrides", {}))
    aggregated["recipes"] = [r.get("name") for r in updated.get("recipes", [])]
    return {"recipes": updated.get("recipes", []), "aggregated": aggregated}


@app.delete("/me/grocery")
async def delete_my_grocery(request: Request):
    user_id = _require_user_id(request)
    async with async_session() as db:
        res = await db.execute(select(GroceryList).where(GroceryList.user_id == user_id))
        row = res.scalar_one_or_none()
        if row:
            await db.delete(row)
            await db.commit()
    return {"ok": True}




@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest, request: Request):
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

    # Enrich session with user's saved preferences, if authenticated
    dietary: list[str] = []
    skill_level: Optional[str] = None
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        uid = verify_token(auth.split(" ", 1)[1])
        if uid:
            profile = await _load_profile(uid)
            dietary = list(profile.get("dietary_restrictions") or [])
            skill_level = profile.get("skill_level")
            # Seed allergies and user dislikes into session once
            sess = ctx.get_or_create_session(session_id)
            if not sess.get("profile_applied"):
                for item in (profile.get("allergies") or []) + (profile.get("disliked_ingredients") or []):
                    if item:
                        ctx.add_dislike(session_id, str(item))
                sess["profile_applied"] = True
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
            modify_recipe(
                current,
                list(dislikes),
                [(r["src"], r["dst"]) for r in replacements if r.get("src") and r.get("dst")],
                dietary,
                skill_level,
                history,
            )
        )
        updated = annotate_recipe_nutrition(updated)
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
                    modify_recipe(current, list(ctx.get_dislikes(session_id)), None, dietary, skill_level, history)
                )
                regenerated = annotate_recipe_nutrition(regenerated)
                ctx.set_current_recipe(session_id, regenerated)
                reply = "Regenerated the recipe based on your dislikes."
                return _respond(session_id, reply, regenerated)
        return _respond(session_id, "Got it. I'll keep that in mind for substitutions.", None)

    if intent == "get_recipe" and parsed.get("recipe_name"):
        rn = parsed.get("recipe_name")
        generated = normalize_recipe(
            generate_recipe(
                rn,
                list(ctx.get_dislikes(session_id)),
                dietary,
                skill_level,
                history,
            )
        )
        generated = annotate_recipe_nutrition(generated)
        ctx.set_current_recipe(session_id, generated)
        reply = f"Here's a recipe for {generated.get('name', rn)}."
        return _respond(session_id, reply, generated)

    # Smalltalk/unknown → generic LLM reply
    resp = ask_llm(message)
    reply = resp.get("text", "I'm here to help with recipes!")
    return _respond(session_id, reply, None)
