import React from 'react';
  
  const Session = () =>  {
	return (
	  <div>
	  </div>
	);
  }
  
  export default Session;
  export function genSessionId() {
  if (typeof crypto !== 'undefined' && crypto?.randomUUID) return crypto.randomUUID()
  return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

export function getSessionId() {
  try {
    const k = 'recipe_session_id'
    let id = localStorage.getItem(k)
    if (!id) {
      id = genSessionId()
      localStorage.setItem(k, id)
    }
    return id
  } catch {
    return genSessionId()
  }
}
