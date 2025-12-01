import { getToken } from './auth'
import { listSavedRecipes, saveRecipeForMe, deleteSavedForMe } from './api'

export async function listSaved() {
  const token = getToken()
  if (!token) return []
  return await listSavedRecipes(token)
}

export async function isSavedByName(name) {
  const n = (name || '').trim().toLowerCase()
  const list = await listSaved()
  return list.some(r => (r.name || '').trim().toLowerCase() === n)
}

export async function saveRecipe(recipe) {
  const token = getToken()
  if (!token) throw new Error('Not signed in')
  const entry = {
    name: recipe?.name,
    ingredients: recipe?.ingredients || [],
    steps: recipe?.steps || [],
  }
  return await saveRecipeForMe(token, entry)
}

export async function removeSavedByName(name) {
  const token = getToken()
  if (!token) throw new Error('Not signed in')
  return await deleteSavedForMe(token, name)
}

export default function Saved() { return null }
