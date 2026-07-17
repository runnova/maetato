import { HomeIcon, SearchIcon, InboxIcon, UserIcon, LogoutIcon } from '../icons.jsx';
import Avatar from './Avatar.jsx';
import { route, navigate } from '../store/nav.js';
import { currentUser, logout } from '../store/auth.js';

export default function Rail() {
  const isActive = (view) => route().view === view || (view === 'search' && route().view === 'guild');

  const doLogout = async () => {
    if (confirm('Log out?')) await logout();
  };

  return (
    <div class="rail">
      <button class={`rail-btn ${isActive('home') ? 'active' : ''}`} onClick={() => navigate({ view: 'home' })} title="Home">
        <HomeIcon size={21} />
      </button>
      <button class={`rail-btn ${isActive('search') ? 'active' : ''}`} onClick={() => navigate({ view: 'search' })} title="Guilds">
        <SearchIcon size={21} />
      </button>
      <button class={`rail-btn ${isActive('inbox') ? 'active' : ''}`} onClick={() => navigate({ view: 'inbox' })} title="Inbox">
        <InboxIcon size={21} />
      </button>
      <button
        class={`rail-btn ${isActive('user') ? 'active' : ''}`}
        onClick={() => navigate({ view: 'user', username: currentUser()?.username })}
        title="Profile"
      >
        <UserIcon size={21} />
      </button>

      <div class="rail-spacer" />

      <button class="rail-btn" onClick={doLogout} title="Log out">
        <LogoutIcon size={19} />
      </button>
      <div class="rail-avatar">
        <Avatar name={currentUser()?.username} src={currentUser()?.pfp} size={42} />
      </div>
    </div>
  );
}
