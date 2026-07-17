import { createSignal, onMount, For, Show } from 'solid-js';
import { api } from '../api.js';
import { route, navigate } from '../store/nav.js';
import { GuildIcon } from '../icons.jsx';

export default function GuildStrip() {
  const [guilds, setGuilds] = createSignal([]);

  onMount(async () => {
    try {
      const res = await api.getSubscribedGuilds();
      setGuilds(res.guilds || []);
    } catch {}
  });

  return (
    <div class="guild-strip">
      <button
        class={`guild-seal ${route().view === 'search' ? 'active' : ''}`}
        style={{ 'border-radius': '14px' }}
        onClick={() => navigate({ view: 'search' })}
        title="Browse guilds"
      >
        <GuildIcon size={20} />
      </button>
      <div class="hairline-divider" style={{ width: '32px', margin: '4px 0' }} />
      <For each={guilds()}>
        {(g) => (
          <button
            class={`guild-seal ${route().view === 'guild' && route().guildId === g.uuid ? 'active' : ''}`}
            onClick={() => navigate({ view: 'guild', guildId: g.uuid })}
            title={g.name}
          >
            {g.icon ? <img src={g.icon} alt="" /> : g.name?.slice(0, 2).toUpperCase()}
          </button>
        )}
      </For>
    </div>
  );
}
