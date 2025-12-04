import React from 'react';
  
  const Saved = () =>  {
	return (
	  <div>
	  </div>
	);
  }
  
  export default Saved;
  const KEY = 'saved_recipes_v1'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {}
}

export function listSaved() {
  return read()
}

export function isSavedByName(name) {
  const n = (name || '').trim().toLowerCase()
  return read().some(r => (r.name || '').trim().toLowerCase() === n)
}

export function saveRecipe(recipe) {
  if (!recipe || !recipe.name) return
  const list = read()
  const n = recipe.name.trim().toLowerCase()
  const exists = list.findIndex(r => (r.name || '').trim().toLowerCase() === n)
  const entry = {
    name: recipe.name,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    savedAt: new Date().toISOString()
  }
  if (exists >= 0) {
    list[exists] = entry
  } else {
    list.unshift(entry)
  }
  write(list)
}

export function removeSavedByName(name) {
  const n = (name || '').trim().toLowerCase()
  const list = read().filter(r => (r.name || '').trim().toLowerCase() !== n)
  write(list)
}

