import { onMount, Show, Switch, Match } from 'solid-js';
import Rail from './components/Rail.jsx';
import GuildStrip from './components/GuildStrip.jsx';
import HomeView from './views/HomeView.jsx';
import SearchView from './views/SearchView.jsx';
import GuildView from './views/GuildView.jsx';
import UserView from './views/UserView.jsx';
import InboxView from './views/InboxView.jsx';
import AuthView from './views/AuthView.jsx';
import { currentUser, authReady, tryRestoreSession } from './store/auth.js';
import { connectSocket, disconnectSocket } from './store/socket.js';
import { route } from './store/nav.js';

export default function App() {
  onMount(async () => {
    await tryRestoreSession();
  });

  return (
    <Show when={authReady()} fallback={<div class="auth-screen" />}>
      <Show when={currentUser()} fallback={<AuthView />}>
        <AuthedShell />
      </Show>
    </Show>
  );
}

function AuthedShell() {
  onMount(() => {
    connectSocket();
  });

  return (
    <div class="app-shell">
      <Rail />
      <Show when={route().view === 'search' || route().view === 'guild'}>
        <GuildStrip />
      </Show>
      <Switch>
        <Match when={route().view === 'home'}><HomeView /></Match>
        <Match when={route().view === 'search'}><SearchView /></Match>
        <Match when={route().view === 'guild'}><GuildView guildId={route().guildId} /></Match>
        <Match when={route().view === 'user'}><UserView username={route().username} /></Match>
        <Match when={route().view === 'inbox'}><InboxView /></Match>
      </Switch>
    </div>
  );
}
