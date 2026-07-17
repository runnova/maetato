import { createSignal } from 'solid-js';
import { api } from '../api.js';

export default function CreateGuildModal(props) {
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  const create = async () => {
    if (!name().trim()) return;
    setBusy(true);
    try {
      const res = await api.createGuild(name().trim(), description().trim());
      props.onCreated?.(res.guilds);
    } catch {
      alert('Could not create guild.');
    }
    setBusy(false);
  };

  return (
    <div class="modal-backdrop" onClick={props.onClose}>
      <div class="modal-card" onClick={(e) => e.stopPropagation()}>
        <div class="modal-title">Make a new bubble</div>
        <div class="auth-field">
          <label>Name</label>
          <input value={name()} onInput={(e) => setName(e.currentTarget.value)} placeholder="Furry paradise" />
        </div>
        <div class="auth-field">
          <label>Description</label>
          <input value={description()} onInput={(e) => setDescription(e.currentTarget.value)} placeholder="What's this bubble about?" />
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" onClick={props.onClose}>Cancel</button>
          <button class="btn-brass" onClick={create} disabled={busy() || !name().trim()}>
            {busy() ? 'Cooking...' : 'Blow bubble'}
          </button>
        </div>
      </div>
    </div>
  );
}
