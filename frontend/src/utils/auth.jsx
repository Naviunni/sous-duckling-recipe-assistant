import React from 'react';
import { login as apiLogin, signup as apiSignup } from './api';

const Auth = () =>  {
  return (
    <div>
    </div>
  );
}

export default Auth;

export async function signIn(email, password) {
  const data = await apiLogin(email, password)
  const { token, profile } = data
  localStorage.setItem("sous_token", token)
  localStorage.setItem("sous_profile", JSON.stringify(profile))
  return token
}

export async function signUp(email, password) {
  const data = await apiSignup(email, password)
  const { token, profile } = data
  localStorage.setItem("sous_token", token)
  localStorage.setItem("sous_profile", JSON.stringify(profile))
  return token
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
