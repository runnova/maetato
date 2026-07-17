import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { BellIcon } from '../icons.jsx';
import { api } from '../api.js';
import { timeAgo } from '../utils.js';
import { onSocket } from '../store/socket.js';

export default function InboxView() {
  const [messages, setMessages] = createSignal([]);
  const [loading, setLoading] = createSignal(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getInbox(1);
      setMessages(res.messages || []);
    } catch {}
    setLoading(false);
  };

  onMount(() => {
    load();
    const off = onSocket('inbox:message', (msg) => setMessages((m) => [msg, ...m]));
    onCleanup(off);
  });

  const markRead = async (m) => {
    try {
      await api.markInboxRead(m.id);
      setMessages((ms) => ms.map((x) => x.id === m.id ? { ...x, read: 1 } : x));
    } catch {}
  };

  return (
    <div class="main-panel">
      <div class="panel-header">
        <BellIcon size={20} style={{ color: 'var(--brass)' }} />
        <div>
          <div class="panel-title">Inbox</div>
          <div class="panel-sub">messages sent your way</div>
        </div>
      </div>
      <div class="scroll-area">
        <Show when={loading()}>
          <div class="empty-state">Checking the inbox...</div>
        </Show>
        <Show when={!loading() && messages().length === 0}>
          <div class="empty-state">
            <div class="title">Nothing here</div>
            <div>You're all caught up.</div>
          </div>
        </Show>
        <For each={messages()}>
          {(m) => (
            <div class="post" style={{ cursor: 'pointer', opacity: m.read ? 0.6 : 1 }} onClick={() => markRead(m)}>
              <div class="post-body">
                <div class="post-head">
                  <span class="post-author">{m.senderId === 'System' ? 'System' : m.senderId}</span>
                  <span class="post-time">· {timeAgo(m.ts)}</span>
                  <Show when={!m.read}><span style={{ color: 'var(--brass)', 'font-size': '11px', 'font-weight': 600 }}>NEW</span></Show>
                </div>
                <div class="post-content">{m.content}</div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
