import { createSignal, onMount, For, Show, createMemo } from 'solid-js';
import { SearchIcon, GuildIcon, PlusIcon, UsersIcon } from '../icons.jsx';
import { api } from '../api.js';
import { navigate } from '../store/nav.js';
import CreateGuildModal from '../components/CreateGuildModal.jsx';

export default function SearchView() {
  const [guilds, setGuilds] = createSignal([]);
  const [query, setQuery] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const [showCreate, setShowCreate] = createSignal(false);
  const [mySubs, setMySubs] = createSignal([]);

  const load = async () => {
    setLoading(true);
    try {
      const [res, subs] = await Promise.all([api.getGuilds(1), api.getSubscribedGuilds()]);
      setGuilds(res.guilds || []);
      setMySubs((subs.guilds || []).map((g) => g.uuid));
    } catch {}
    setLoading(false);
  };

  onMount(load);

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return guilds();
    return guilds().filter((g) => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
  });

  const joinGuild = async (g, e) => {
    e.stopPropagation();
    try {
      await api.joinGuild(g.uuid);
      setMySubs((s) => [...s, g.uuid]);
    } catch {}
  };

  return (
    <div class="main-panel">
      <div class="panel-header" style={{ 'justify-content': 'space-between' }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
          <GuildIcon size={20} style={{ color: 'var(--brass)' }} />
          <div>
            <div class="panel-title">Bubbles</div>
          </div>
        </div>
        <button class="btn-brass" onClick={() => setShowCreate(true)} style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
          <PlusIcon size={16} /> New guild
        </button>
      </div>

      <div class="scroll-area">
        <div class="search-bar" style={{ 'margin-top': '20px' }}>
          <SearchIcon size={18} style={{ color: 'var(--muted)' }} />
          <input placeholder="Search guilds..." value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
        </div>

        <Show when={loading()}>
          <div class="empty-state">Gathering guilds...</div>
        </Show>
        <Show when={!loading() && filtered().length === 0}>
          <div class="empty-state">
            <div class="title">No guilds found</div>
            <div>Start one of your own.</div>
          </div>
        </Show>

        <div class="bubble-grid">
          <For each={filtered()}>
            {(g) => (
              <div class="guild-card" onClick={() => navigate({ view: 'guild', guildId: g.uuid })} style={{ cursor: 'pointer' }}>
                <div class="guild-card-top">
                  <div class="guild-seal" style={{ position: 'static' }}>
                    {g.icon ? <img src={g.icon} alt="" /> : g.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div class="guild-card-name">{g.name}</div>
                    <div class="guild-card-meta">
                      <UsersIcon size={12} style={{ 'vertical-align': '-2px' }} /> {JSON.parse(g.memberIds)?.length ?? 0} members
                    </div>
                  </div>
                </div>
                <div class="guild-card-desc">{g.description || 'No description yet.'}</div>
                <Show when={!mySubs().includes(g.uuid)} fallback={<button class="btn-ghost">Joined</button>}>
                  <button class="btn-ghost" onClick={(e) => joinGuild(g, e)}>Join</button>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>

      <Show when={showCreate()}>
        <CreateGuildModal onClose={() => setShowCreate(false)} onCreated={(g) => { setGuilds((gs) => [g, ...gs]); setShowCreate(false); navigate({ view: 'guild', guildId: g.id || g.uuid }); }} />
      </Show>
    </div>
  );
}
