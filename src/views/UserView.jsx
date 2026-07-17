import { createSignal, createEffect, For, Show } from 'solid-js';
import Avatar from '../components/Avatar.jsx';
import Post from '../components/Post.jsx';
import { api } from '../api.js';
import { currentUser, updateLocalUser } from '../store/auth.js';
import { UsersIcon } from '../icons.jsx';

export default function UserView(props) {
  const [user, setUser] = createSignal(null);
  const [posts, setPosts] = createSignal([]);
  const [tab, setTab] = createSignal('posts');
  const [loading, setLoading] = createSignal(true);
  const [editing, setEditing] = createSignal(false);
  const [bioDraft, setBioDraft] = createSignal('');

  const isMe = () => user()?.uuid === currentUser()?.uuid;

  const load = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        api.getUser(props.username),
      ]);
      setUser(u.user);
      setPosts(p.posts || []);
      setBioDraft(u.user.bio || '');
    } catch {}
    setLoading(false);
  };

  createEffect(() => { if (props.username) load(); });

  const toggleFollow = async () => {
    try {
      if (user().relationship?.following) {
        await api.unfollow(user().uuid);
        setUser((u) => ({ ...u, relationship: { ...u.relationship, following: false }, followerCount: u.followerCount - 1 }));
      } else {
        await api.follow(user().uuid);
        setUser((u) => ({ ...u, relationship: { ...u.relationship, following: true }, followerCount: u.followerCount + 1 }));
      }
    } catch {}
  };

  const saveBio = async () => {
    try {
      await api.updateUser({ bio: bioDraft() });
      setUser((u) => ({ ...u, bio: bioDraft() }));
      updateLocalUser({ bio: bioDraft() });
      setEditing(false);
    } catch {}
  };

  return (
    <div class="main-panel">
      <Show when={!loading() && user()}>
        <div class="scroll-area">
          <div class="profile-banner" />
          <div class="profile-head">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar">
                {user().pfp ? <img src={user().pfp} alt="" /> : user().username?.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div class="profile-name">{user().username}</div>
            <div class="profile-username">@{user().username} · {user().uuid?.slice(0, 8)}</div>

            <Show when={editing()} fallback={
              <div class="profile-bio">{user().bio || (isMe() ? 'No bio yet: tell people about yourself.' : '')}</div>
            }>
              <textarea
                value={bioDraft()}
                onInput={(e) => setBioDraft(e.currentTarget.value)}
                rows={2}
                style={{ width: '100%', 'max-width': '480px', 'margin-top': '12px', padding: '8px', 'border-radius': '8px', border: '1px solid var(--line)', background: 'var(--paper)' }}
              />
            </Show>

            <div class="profile-stats">
              <span><b>{user().followingCount ?? 0}</b> Following</span>
              <span><b>{user().followerCount ?? 0}</b> Followers</span>
            </div>

            <div class="profile-actions">
              <Show when={isMe()} fallback={
                <button class="btn-brass" onClick={toggleFollow}>
                  {user().relationship?.following ? 'Following' : 'Follow'}
                </button>
              }>
                <Show when={editing()} fallback={<button class="btn-ghost" onClick={() => setEditing(true)}>Edit profile</button>}>
                  <button class="btn-brass" onClick={saveBio}>Save</button>
                  <button class="btn-ghost" onClick={() => { setEditing(false); setBioDraft(user().bio || ''); }}>Cancel</button>
                </Show>
              </Show>
            </div>
          </div>

          <div class="tab-row">
            <div class={`tab-item ${tab() === 'posts' ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setTab('posts')}>Posts</div>
            <div class={`tab-item ${tab() === 'followers' ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setTab('followers')}>
              <UsersIcon size={13} style={{ 'vertical-align': '-2px' }} /> Followers
            </div>
          </div>

          <Show when={tab() === 'posts'}>
            <Show when={posts().length === 0}>
              <div class="empty-state">
                <div class="title">No posts yet</div>
              </div>
            </Show>
            <For each={posts()}>
              {(post) => <Post post={post} onDelete={(id) => setPosts((p) => p.filter((x) => x.id !== id))} />}
            </For>
          </Show>

          <Show when={tab() === 'followers'}>
            <FollowerList uuid={user().uuid} />
          </Show>
        </div>
      </Show>
      <Show when={loading()}>
        <div class="empty-state">Loading profile...</div>
      </Show>
    </div>
  );
}

function FollowerList(props) {
  const [users, setUsers] = createSignal([]);
  createEffect(async () => {
    try {
      const res = await api.followers(props.uuid);
      setUsers(res.users || []);
    } catch {}
  });
  return (
    <div class="member-list">
      <For each={users()}>
        {(u) => (
          <div class="member-item">
            <Avatar name={u.username} src={u.pfp} size={34} />
            <span>{u.username}</span>
          </div>
        )}
      </For>
      <Show when={users().length === 0}>
        <div style={{ color: 'var(--muted)', padding: '14px' }}>No followers yet.</div>
      </Show>
    </div>
  );
}
