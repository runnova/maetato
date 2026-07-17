import { createSignal, Show, For } from 'solid-js';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../utils.js';
import { api } from '../api.js';
import { currentUser } from '../store/auth.js';
import { SmileIcon } from '../icons.jsx';

const QUICK_EMOJI = ['👍', '❤️', '😂', '🎉', '👀'];

export default function GuildMessage(props) {
  const msg = () => props.message;
  const [showPicker, setShowPicker] = createSignal(false);

  const toggleReaction = async (emoji) => {
    const existing = (msg().reactions || []).find((r) => r.emoji === emoji || r.name === emoji);
    try {
      if (existing?.reactedByMe) {
        await api.removeReaction(props.guildId, msg().id, emoji);
      } else {
        await api.addReaction(props.guildId, msg().id, emoji);
      }
      props.onReacted?.();
    } catch {}
    setShowPicker(false);
  };

  return (
    <div class="message-row">
      <Avatar name={msg().author?.username} src={msg().author?.pfp} size={38} />
      <div class="message-body">
        <div class="msg-head">
          <span class="msg-author">{msg().author?.username}</span>
          <span class="msg-time">{timeAgo(msg().ts)}</span>
        </div>
        <Show when={msg().content}>
          <div class="msg-content">{msg().content}</div>
        </Show>
        <Show when={msg().attachments?.length}>
          <div class="post-attachments">
            <For each={msg().attachments}>{(url) => <img src={url} alt="" />}</For>
          </div>
        </Show>

        <div class="msg-reactions">
          <For each={msg().reactions || []}>
            {(r) => (
              <button class={`reaction-pill ${r.reactedByMe ? 'mine' : ''}`} onClick={() => toggleReaction(r.emoji || r.name)}>
                <span>{r.emoji || `:${r.name}:`}</span><span>{r.count}</span>
              </button>
            )}
          </For>
          <div style={{ position: 'relative' }}>
            <button class="icon-btn" onClick={() => setShowPicker((v) => !v)}>
              <SmileIcon size={15} />
            </button>
            <Show when={showPicker()}>
              <div style={{
                position: 'absolute', bottom: '28px', left: 0, background: 'var(--paper-2)',
                border: '1px solid var(--line)', 'border-radius': '10px', padding: '6px 8px',
                display: 'flex', gap: '4px', 'z-index': 10, 'box-shadow': '0 8px 24px rgba(0,0,0,.15)',
              }}>
                <For each={QUICK_EMOJI}>
                  {(e) => <button class="icon-btn" style={{ 'font-size': '16px' }} onClick={() => toggleReaction(e)}>{e}</button>}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
