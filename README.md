# Sous Duckling : an AI-Assisted Recipe Assistant

A smart conversational recipe assistant! Users can ask for recipes, get ingredients and step-by-step instructions, declare dislikes or missing ingredients, and receive suggested substitutions. Conversation context is stored per session.

## Quick Start

### Backend

Requirements: Python 3.10+

1. Create a virtual environment and install deps:

```
cd sous-duckling-recipe-assistant
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. Database Setup (PostgreSQL):
Install PostgreSQL if you haven't already.
Create the database in PostgreSQL:
```
createdb sous_duckling_db
```

Configure Environment: 
Create a .env file in the project root directory. Add your database URL
Note: Use the format below, replacing YOUR_PASSWORD with your actual local DB password
```
# Format: postgresql+asyncpg://user:password@host/dbname
DATABASE_URL="postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost/sous_duckling_db"
```

Run Migrations: Apply the database schema using Alembic
```
cd backend
alembic upgrade head
```

3. Run the backend (FastAPI + Uvicorn):

```
uvicorn backend.app:app --reload
```

The API will be available at `http://localhost:8000`.

4. Enable real LLM responses (OpenAI GPT-4o):
Set your API key in .env and optionally the model/base URL, then restart the server.

```
OPENAI_API_KEY=sk-...           # required for real calls
OPENAI_MODEL=gpt-4o             # optional (default: gpt-4o)
```

Without `OPENAI_API_KEY`, the backend returns mock replies and may use local recipes.

### Frontend

Requirements: Node 18+

1. Install dependencies:

```
cd frontend
npm install
```

2. Start the dev server:

```
npm run dev
```

Open `http://localhost:5173`. The frontend points to `http://localhost:8000` by default. You can override with `VITE_API_BASE`.
Navigation:
- Home → Welcome screen and a “Start Chatting” button.
- Chat → Conversational interface backed by the API.
- Saved Recipes

## Backend Overview

- Framework: FastAPI
- Endpoints:
  - `POST /ask` → Conversational endpoint; LLM generates recipe JSON (name, ingredients, steps). Falls back to local data if no API key.
  - `GET /recipes/{name}` → Fetch a recipe by name (local data)
  - `POST /substitute` → Suggest ingredient substitutions

Modules:

- `backend/app.py` — FastAPI app, routes, models, and orchestration
- `backend/recipe_retrieval.py` — Fetch recipes from local `data/recipes.json` (extensible to APIs)
- `backend/substitution_engine.py` — Rule-based substitutions + helpers to apply them
- `backend/context_manager.py` — In-memory session context (current recipe, dislikes)
- `backend/llm_interface.py` — OpenAI wrapper providing `ask_llm`, `generate_recipe`, `has_llm`
- `backend/utils/logging_utils.py` — Lightweight structured logger

## Frontend Overview

- Framework: React (Vite)
- Components:
  - `Header.jsx` — Top navigation bar (Home, Chat, Saved)
  - `ChatUI.jsx` — Chat interface (user + assistant)
  - `RecipeCard.jsx` — Displays recipe name, ingredients, steps
  - Pages: `Home.jsx` (welcome + CTA), `Chat.jsx` (conversation), `SavedRecipes.jsx` (placeholder)
  - `App.jsx` — Router and layout

## Data

- `data/recipes.json` — Mock recipes for local testing (e.g., Lasagna, Pancakes)

## Extensibility

- Swap `ask_llm` in `llm_interface.py` with OpenAI or Ollama integration
- Extend `recipe_retrieval.py` to use Spoonacular/Edamam
- Replace in-memory session with Redis or DB for multi-user deployments

## Notes

- CORS is enabled for all origins in development.
- Intent parsing in `/ask` is intentionally simple for a starting point.
