import React from 'react';
  
  const Api = () =>  {
	return (
	  <div>
	  </div>
	);
  }
  
  export default Api;
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function ask(message, sessionId) {
  const headers = { 'Content-Type': 'application/json' }
  try {
    const token = localStorage.getItem('sous_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  } catch {}
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, session_id: sessionId })
  })
  if (!res.ok) throw new Error(`ask failed: ${res.status}`)
  return res.json()
}

export async function substitute(ingredient) {
  const res = await fetch(`${API_BASE}/substitute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredient })
  })
  if (!res.ok) throw new Error(`substitute failed: ${res.status}`)
  return res.json()
}

export async function signup(email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `signup failed: ${res.status}`)
  return data
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `login failed: ${res.status}`)
  return data
}

export async function saveMyProfile(token, profile) {
  const res = await fetch(`${API_BASE}/me/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profile)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `save profile failed: ${res.status}`)
  return data
}

export async function getMyProfile(token) {
  const res = await fetch(`${API_BASE}/me/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `get profile failed: ${res.status}`)
  return data
}
