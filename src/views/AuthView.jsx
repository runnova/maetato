import { createSignal, Show } from 'solid-js';
import { login, register, authError } from '../store/auth.js';

export default function AuthView() {
  const [mode, setMode] = createSignal('login');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username() || !password()) return;
    setBusy(true);
    if (mode() === 'login') await login(username(), password());
    else await register(username(), password());
    setBusy(false);
  };

  return (
    <div class="auth-screen">
      <div class="auth-card">
        <div class="auth-wordmark">MaeClient</div>
        <div class="auth-tag"></div>

        <Show when={authError()}>
          <div class="auth-error">{authError()}</div>
        </Show>

        <form onSubmit={submit}>
          <div class="auth-field">
            <label>Username</label>
            <input
              type="text"
              autocomplete="username"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
            />
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input
              type="password"
              autocomplete={mode() === 'login' ? 'current-password' : 'new-password'}
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
          </div>
          <button type="submit" class="btn-brass" style={{ width: '100%', 'margin-top': '8px' }} disabled={busy()}>
            {busy() ? 'Please wait...' : mode() === 'login' ? 'Enter' : 'Create account'}
          </button>
        </form>

        <div class="auth-toggle">
          {mode() === 'login' ? "New here?" : 'Already have an account?'}{' '}
          <button onClick={() => setMode(mode() === 'login' ? 'register' : 'login')}>
            {mode() === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
