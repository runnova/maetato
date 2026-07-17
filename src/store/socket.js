import { createSignal } from 'solid-js';
import { API_BASE, getAccessToken } from '../api.js';

const listeners = new Map();
let ws = null;
export const [wsConnected, setWsConnected] = createSignal(false);

function wsUrl() {
  return API_WS;
}

export function connectSocket() {
  const token = getAccessToken();
  if (!token || (ws && ws.readyState === WebSocket.OPEN)) return;
  try {
    ws = new WebSocket(wsUrl());
  } catch {
    return;
  }
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token }));
  };
  ws.onmessage = (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; }
    if (msg.type === 'authenticated') setWsConnected(true);
    const set = listeners.get(msg.type);
    if (set) set.forEach((fn) => fn(msg));
  };
  ws.onclose = () => {
    setWsConnected(false);
    ws = null;
    setTimeout(() => { if (getAccessToken()) connectSocket(); }, 3000);
  };
  ws.onerror = () => { try { ws.close(); } catch {} };
}

export function disconnectSocket() {
  if (ws) { ws.close(); ws = null; }
  setWsConnected(false);
}

export function onSocket(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type)?.delete(fn);
}
