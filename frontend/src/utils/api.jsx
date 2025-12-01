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
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

