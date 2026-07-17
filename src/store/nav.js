import { createSignal } from 'solid-js';

export const [route, setRoute] = createSignal({ view: 'home' });

export function navigate(next) {
  setRoute(next);
}
