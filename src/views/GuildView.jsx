import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js';
import { HashIcon, PlusIcon, ImageIcon, SendIcon, UsersIcon, ChevronLeftIcon } from '../icons.jsx';
import { api } from '../api.js';
import { onSocket } from '../store/socket.js';
import { navigate } from '../store/nav.js';
import GuildMessage from '../components/GuildMessage.jsx';
import Avatar from '../components/Avatar.jsx';

export default function GuildView(props) {
  const [guild, setGuild] = createSignal(null);
  const [channels, setChannels] = createSignal([]);
  const [activeChannel, setActiveChannel] = createSignal(null);
  const [messages, setMessages] = createSignal([]);
  const [draft, setDraft] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const [showMembers, setShowMembers] = createSignal(false);
  const [members, setMembers] = createSignal([]);
  let fileInput;
  let scrollRef;

  const guildId = () => props.guildId;

  const loadAll = async () => {
    setLoading(true);
    try {
      const [chRes, feedRes] = await Promise.all([
        api.getChannels(guildId()),
        api.getGuildFeed(guildId()),
      ]);
      setChannels(chRes.channels || []);
      const first = (chRes.channels || [])[0];
      setActiveChannel(first?.id || 'general');
      setMessages((feedRes.posts || []).filter((p) => !first || p.channelId === (first?.id || 'general')));
      setGuild({ uuid: guildId(), name: first ? undefined : undefined });
    } catch {}
    setLoading(false);
  };

  const loadChannelMessages = async (channelId) => {
    try {
      const res = await api.getGuildFeed(guildId());
      setMessages((res.posts || []).filter((p) => p.channelId === channelId));
    } catch {}
  };

  createEffect(() => {
    if (guildId()) loadAll();
  });

  createEffect(() => {
    const off = onSocket('guild:post', (msg) => {
      if (msg.guildId === guildId() && msg.channelId === activeChannel()) {
        setMessages((m) => [...m, msg]);
        queueMicrotask(() => { if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight; });
      }
    });
    const offReact = onSocket('guild:post:reaction', (msg) => {
      if (msg.guildId === guildId()) {
        setMessages((m) => m.map((x) => x.id === msg.postId ? { ...x, reactions: msg.reaction?.all || x.reactions } : x));
      }
    });
    const offChCreate = onSocket('guild:channel:create', (msg) => {
      if (msg.guildId === guildId()) setChannels((c) => [...c, msg.channel]);
    });
    const offChDelete = onSocket('guild:channel:delete', (msg) => {
      if (msg.guildId === guildId()) setChannels((c) => c.filter((ch) => ch.id !== msg.channelId));
    });
    onCleanup(() => { off(); offReact(); offChCreate(); offChDelete(); });
  });

  const selectChannel = (ch) => {
    setActiveChannel(ch.id);
    loadChannelMessages(ch.id);
  };

  const addChannel = async () => {
    const name = prompt('Channel name');
    if (!name) return;
    try {
      const res = await api.createChannel(guildId(), name);
      setChannels((c) => [...c, res.channel]);
    } catch {}
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.upload(file);
      const content = draft();
      await api.postToChannel(guildId(), activeChannel(), { content, attachments: [res.file.url] });
      setDraft('');
    } catch {}
    e.target.value = '';
  };

  const send = async () => {
    const content = draft().trim();
    if (!content) return;
    setDraft('');
    try {
      const res = await api.postToChannel(guildId(), activeChannel(), { content });
      setMessages((m) => [...m, res.post]);
      queueMicrotask(() => { if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight; });
    } catch {}
  };

  const openMembers = async () => {
    setShowMembers((v) => !v);
    if (!members().length) {
      try {
        const res = await api.getMembers(guildId());
        setMembers(res.members || []);
      } catch {}
    }
  };

  return (
    <div class="guild-view">
      <div class="channel-sidebar">
        <div class="channel-sidebar-head" style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <button class="icon-btn" onClick={() => navigate({ view: 'search' })}><ChevronLeftIcon size={16} /></button>
          <span class="name">{guild()?.name || 'Guild'}</span>
        </div>
        <div class="channel-list">
          <For each={channels()}>
            {(ch) => (
              <div class={`channel-item ${activeChannel() === ch.id ? 'active' : ''}`} onClick={() => selectChannel(ch)} style={{ cursor: 'pointer' }}>
                <HashIcon size={15} /> {ch.name}
              </div>
            )}
          </For>
        </div>
        <div class="channel-add">
          <button class="btn-ghost" style={{ width: '100%', display: 'flex', gap: '6px', 'align-items': 'center', 'justify-content': 'center' }} onClick={addChannel}>
            <PlusIcon size={14} /> Channel
          </button>
        </div>
      </div>

      <div class="messages-col">
        <div class="panel-header" style={{ 'justify-content': 'space-between' }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <HashIcon size={18} style={{ color: 'var(--brass)' }} />
            <span class="panel-title" style={{ 'font-size': '17px' }}>{channels().find((c) => c.id === activeChannel())?.name || 'general'}</span>
          </div>
          <button class="icon-btn" onClick={openMembers}><UsersIcon size={19} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, 'min-height': 0 }}>
          <div class="scroll-area" ref={scrollRef} style={{ flex: 1 }}>
            <Show when={loading()}>
              <div class="empty-state">Opening the hall...</div>
            </Show>
            <Show when={!loading() && messages().length === 0}>
              <div class="empty-state">
                <div class="title">No messages yet</div>
                <div>Be the first to speak in this channel.</div>
              </div>
            </Show>
            <For each={messages()}>
              {(m) => <GuildMessage message={m} guildId={guildId()} onReacted={() => loadChannelMessages(activeChannel())} />}
            </For>
          </div>

          <Show when={showMembers()}>
            <div class="channel-sidebar" style={{ 'border-left': '1px solid var(--line)', 'border-right': 'none' }}>
              <div class="channel-sidebar-head"><span class="name">Members</span></div>
              <div class="member-list">
                <For each={members()}>
                  {(u) => (
                    <div class="member-item" style={{ cursor: 'pointer' }} onClick={() => navigate({ view: 'user', username: u.username })}>
                      <Avatar name={u.username} src={u.pfp} size={30} />
                      <span style={{ 'font-size': '13.5px' }}>{u.username}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        <div class="message-composer">
          <div class="message-input-wrap">
            <button class="icon-btn" onClick={() => fileInput.click()}><ImageIcon size={18} /></button>
            <input type="file" ref={fileInput} style={{ display: 'none' }} onChange={pickFile} />
            <textarea
              rows={1}
              placeholder={`Message #${channels().find((c) => c.id === activeChannel())?.name || 'general'}`}
              value={draft()}
              onInput={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button class="icon-btn send" onClick={send}><SendIcon size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
