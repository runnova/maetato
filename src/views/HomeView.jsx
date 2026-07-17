import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import Avatar from '../components/Avatar.jsx';
import Post from '../components/Post.jsx';
import { ImageIcon, HomeIcon } from '../icons.jsx';
import { api } from '../api.js';
import { currentUser } from '../store/auth.js';
import { onSocket } from '../store/socket.js';

export default function HomeView() {
  const [posts, setPosts] = createSignal([]);
  const [draft, setDraft] = createSignal('');
  const [attachments, setAttachments] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [posting, setPosting] = createSignal(false);
  const [page, setPage] = createSignal(1);
  let fileInput;

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.getHome(p);
      setPosts(p === 1 ? res.posts : [...posts(), ...res.posts]);
      setPage(p);
    } catch {}
    setLoading(false);
  };

  onMount(() => {
    load(1);
    const offNew = onSocket('home:post', (msg) => {
      setPosts((p) => [msg, ...p]);
    });
    const offDel = onSocket('home:post:delete', (msg) => {
      setPosts((p) => p.filter((x) => x.id !== msg.postId));
    });
    const offLike = onSocket('home:post:like', (msg) => {
      setPosts((p) => p.map((x) => x.id === msg.postId ? { ...x, usersLiked: JSON.stringify(msg.users_liked || []) } : x));
    });
    onCleanup(() => { offNew(); offDel(); offLike(); });
  });

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.upload(file);
      setAttachments((a) => [...a, res.file.url]);
    } catch {
      alert('Upload failed: is the uploads server enabled?');
    }
    e.target.value = '';
  };

  const submitPost = async () => {
    const content = draft().trim();
    if (!content && attachments().length === 0) return;
    setPosting(true);
    try {
      const res = await api.createPost(content, attachments());
      setPosts((p) => [{
        id: res.postId,
        uuid: res.postUuid,
        content: res.content,
        attachments: res.attachments,
        ts: res.ts,
        author: res.author,
        usersLiked: '[]',
        likes: 0,
        commentCount: 0,
        replyCount: 0,
      }, ...p]);
      setDraft('');
      setAttachments([]);
    } catch {}
    setPosting(false);
  };

  const removeAttachment = (url) => setAttachments((a) => a.filter((x) => x !== url));

  return (
    <div class="main-panel">
      <div class="scroll-area">
        <div class="composer">
          <Avatar name={currentUser()?.username} src={currentUser()?.pfp} />
          <div style={{ flex: 1, display: 'flex', "flex-direction": "column" }}>
            <textarea
              placeholder={`Send as a post as ${currentUser()?.username}`}
              value={draft()}
              onInput={(e) => setDraft(e.currentTarget.value)}
              rows={2}
            />
            <Show when={attachments().length}>
              <div class="post-attachments">
                <For each={attachments()}>
                  {(url) => (
                    <div style={{ position: 'relative' }}>
                      <img src={url} alt="" />
                      <button
                        class="icon-btn"
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(28,35,51,.7)', color: '#fff', 'border-radius': '50%' }}
                        onClick={() => removeAttachment(url)}
                      >×</button>
                    </div>
                  )}
                </For>
              </div>
            </Show>
            <div class="composer-footer" style={{ 'justify-content': 'space-between' }}>
              <button class="icon-btn" onClick={() => fileInput.click()}>
                <ImageIcon size={19} />
              </button>
              <input type="file" accept="image/*" ref={fileInput} style={{ display: 'none' }} onChange={pickFile} />
              <button class="btn-brass" onClick={submitPost} disabled={posting() || (!draft().trim() && !attachments().length)}>
                Post
              </button>
            </div>
          </div>
        </div>

        <Show when={loading() && posts().length === 0}>
          <div class="empty-state">Loading the feed...</div>
        </Show>
        <Show when={!loading() && posts().length === 0}>
          <div class="empty-state">
            <div class="title">The hall is quiet</div>
            <div>Be the first to say something.</div>
          </div>
        </Show>

        <For each={posts()}>
          {(post) => <Post post={post} onDelete={(id) => setPosts((p) => p.filter((x) => x.id !== id))} />}
        </For>

        <Show when={posts().length > 0}>
          <div style={{ padding: '18px', 'text-align': 'center' }}>
            <button class="btn-ghost" onClick={() => load(page() + 1)}>Load more</button>
          </div>
        </Show>
      </div>
    </div>
  );
}
