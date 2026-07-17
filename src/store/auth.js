import { createSignal } from 'solid-js';
import { api, setTokens, clearTokens, getAccessToken } from '../api.js';

export const [currentUser, setCurrentUser] = createSignal(null);
export const [authReady, setAuthReady] = createSignal(false);
export const [authError, setAuthError] = createSignal('');

export async function tryRestoreSession() {
  const token = getAccessToken();
  if (!token) { setAuthReady(true); return; }
  try {
    const res = await api.loginWithToken(token);
    setTokens(res.user);
    setCurrentUser(res.user);
  } catch {
    clearTokens();
  } finally {
    setAuthReady(true);
  }
}

export async function login(username, password) {
  setAuthError('');
  try {
    const res = await api.login({ username, password });
    setTokens(res.user);
    setCurrentUser(res.user);
    return true;
  } catch (e) {
    setAuthError(e.status === 401 ? 'Invalid username or password.' : 'Something went wrong. Try again.');
    return false;
  }
}

export async function register(username, password) {
  setAuthError('');
  try {
    const res = await api.register(username, password);
    setTokens(res.user);
    setCurrentUser(res.user);
    return true;
  } catch (e) {
    setAuthError(e.data?.code || 'Could not create that account.');
    return false;
  }
}

export async function logout() {
  try { await api.logout(); } catch { /* ignore */ }
  clearTokens();
  setCurrentUser(null);
}

export function updateLocalUser(patch) {
  setCurrentUser((u) => u ? { ...u, ...patch } : u);
}
