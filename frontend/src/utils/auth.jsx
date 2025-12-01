import React from 'react';
  
  const Auth = () =>  {
	return (
	  <div>
	  </div>
	);
  }
  
  export default Auth;
  const MOCK_USERS = {
  john: {
    password: "password123",
    profile: { id: "1", name: "John Doe", email: "john@example.com" },
  },
  "john@example.com": {
    password: "password123",
    profile: { id: "1", name: "John Doe", email: "john@example.com" },
  },
};

export async function signInMock(identifier, password) {
  await new Promise((r) => setTimeout(r, 600));
  const key = (identifier || "").toLowerCase();
  const user = MOCK_USERS[key];
  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }
  const token = `mock-token-${user.profile.id}-${Date.now()}`;
  localStorage.setItem("sous_token", token);
  localStorage.setItem("sous_profile", JSON.stringify(user.profile));
  return token;
}

export function getToken() {
  return localStorage.getItem("sous_token");
}

export function getProfile() {
  const raw = localStorage.getItem("sous_profile");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem("sous_token");
  localStorage.removeItem("sous_profile");
}