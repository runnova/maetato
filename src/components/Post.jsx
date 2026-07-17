import { createSignal, Show, For } from 'solid-js';
import Avatar from './Avatar.jsx';
import { HeartIcon, CommentIcon, ShareIcon, TrashIcon } from '../icons.jsx';
import { timeAgo, parseLikedUsers } from '../utils.js';
import { api } from '../api.js';
import { currentUser } from '../store/auth.js';
import { navigate } from '../store/nav.js';

export default function Post(props) {
  const post = () => props.post;
  const [expanded, setExpanded] = createSignal(false);
  const [comments, setComments] = createSignal([]);
  const [commentDraft, setCommentDraft] = createSignal('');
  const [loadingComments, setLoadingComments] = createSignal(false);
  const [localLike, setLocalLike] = createSignal(null);

  const liked = () => {
    if (localLike() !== null) return localLike();
    return parseLikedUsers(post().usersLiked, currentUser()?.uuid).likedByMe;
  };
  const likeCount = () => {
    const base = parseLikedUsers(post().usersLiked, currentUser()?.uuid).count;
    if (localLike() === null) return base;
    return liked() ? base : base;
  };

  const toggleLike = async (e) => {
    e.stopPropagation();
    const next = !liked();
    setLocalLike(next);
    try {
      await api.likePost(post().id, next);
    } catch {
      setLocalLike(!next);
    }
  };

  const loadComments = async () => {
    const opening = !expanded();
    setExpanded(opening);

    if (opening && comments().length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.getComments(post().id);
        setComments(res.comments || res.items || []);
      } finally {
        setLoadingComments(false);
      }
    }
  };
  const submitComment = async () => {
    const content = commentDraft().trim();
    if (!content) return;
    setCommentDraft('');
    try {
      const res = await api.addComment(post().id, content);
      setComments((c) => [...c, res.comment || res]);
    } catch { }
  };

  const removePost = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(post().id);
      props.onDelete?.(post().id);
    } catch { }
  };

  const mine = () => post().author?.uuid === currentUser()?.uuid || post().userId === currentUser()?.uuid;

  return (
    <div class="post">
      <div onClick={() => navigate({ view: 'user', username: post().author?.username })} style={{ cursor: 'pointer' }}>
        <Avatar name={post().author?.username} src={post().author?.pfp} />
      </div>
      <div class="post-body">
        <div class="post-head">
          <span
            class="post-author"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate({ view: 'user', username: post().author?.username })}
          >
            {post().author?.username || 'unknown'}
          </span>
          <span class="post-time">· {timeAgo(post().ts)}</span>
        </div>
        <Show when={post().content}>
          <div class="post-content">{post().content}</div>
        </Show>
        <Show when={post().attachments?.length}>
          <div class="post-attachments">
            <For each={post().attachments}>{(url) => <img src={url} alt="attachment" />}</For>
          </div>
        </Show>
        <div class="post-actions">
          <button class={`post-action ${liked() ? 'liked' : ''}`} onClick={toggleLike}>
            <HeartIcon size={16} filled={liked()} /> {likeCount()}
          </button>
          <button class="post-action" onClick={loadComments}>
            <CommentIcon size={16} /> {post().commentCount ?? comments().length ?? ''}
          </button>
          <Show when={mine()}>
            <button class="post-action" onClick={removePost}>
              <TrashIcon size={16} />
            </button>
          </Show>
        </div>

        <Show when={expanded()}>
          <div style={{ 'margin-top': '12px', 'padding-top': '10px', 'border-top': '1px solid var(--line)' }}>
            <Show when={loadingComments()}>
              <div style={{ color: 'var(--muted)', 'font-size': '13px' }}>Loading comments...</div>
            </Show>
            <For each={comments()}>
              {(c) => (
                <div style={{ display: 'flex', gap: '10px', 'margin-bottom': '10px' }}>
                  <Avatar name={c.author?.username || c.username || c.author} src={c.author?.pfp} size={28} />
                  <div>
                    <div style={{ 'font-size': '13px' }}>
                      <b>{c.author?.username || c.username || c.author}</b>
                    </div>
                    <div style={{ 'font-size': '13.5px' }}>{c.content}</div>
                  </div>
                </div>
              )}
            </For>
            <div style={{ display: 'flex', gap: '8px', 'margin-top': '8px' }}>
              <input
                placeholder="Write a comment..."
                value={commentDraft()}
                onInput={(e) => setCommentDraft(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
                style={{ flex: 1, border: '1px solid var(--line)', 'border-radius': '18px', padding: '7px 14px', 'font-size': '13.5px', background: 'var(--paper)' }}
              />
              <button class="btn-brass" onClick={submitComment}>Reply</button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
