export const API_BASE = localStorage.getItem('apiBase') || 'https://dev.maelink.net';
export const API_WS =  localStorage.getItem('apiBase') || 'wss://dev.maelink.net/socket';
export const UPLOADS_BASE = localStorage.getItem('uploadsBase') || 'http://localhost:7002';

function getAccessToken() {
  return localStorage.getItem('accessToken');
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function request(path, { method = 'GET', body, headers = {}, base = API_BASE, auth = true } = {}) {
  const finalHeaders = { ...headers };
  let finalBody = body;
  if (body && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${base}${path}`, { method, headers: finalHeaders, body: finalBody });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    const err = new Error(data?.code || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  version: () => request('/version', { auth: false }),
  register: (username, password) => request('/register', { method: 'POST', body: { username, password }, auth: false }),
  login: (body) => request('/login', { method: 'POST', body, auth: false }),
  loginWithToken: (token) => request('/login', { method: 'POST', body: { token }, auth: false }),
  logout: (setCookie = false) => request('/logout', { method: 'POST', body: { setCookie } }),

  upload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/upload', { method: 'POST', body: fd, base: UPLOADS_BASE });
  },

  getHome: (page = 1) => request(`/home?page=${page}`),
  createPost: (content, attachments = [], clientId = 'web') => request('/home', { method: 'POST', body: { content, attachments, clientId } }),
  updatePost: (postId, body) => request('/home', { method: 'PATCH', body: { postId, ...body } }),
  deletePost: (postId) => request('/home', { method: 'DELETE', body: { postId } }),
  likePost: (postId, like) => request('/home', { method: 'PATCH', body: { postId, like } }),

  getComments: (postId) => request(`/home/${postId}/comments`),
  addComment: (postId, content) => request(`/home/${postId}/comments`, { method: 'POST', body: { content } }),
  deleteComment: (postId, commentId) => request(`/home/${postId}/comments/${commentId}`, { method: 'DELETE' }),

  getReplies: (postId) => request(`/home/${postId}/replies`),
  addReply: (postId, content, parentReplyId) => request(`/home/${postId}/replies`, { method: 'POST', body: { content, parentReplyId } }),
  deleteReply: (postId, replyId) => request(`/home/${postId}/replies/${replyId}`, { method: 'DELETE' }),

  getUser: (username) => request(`/user/${encodeURIComponent(username)}`),
  getUserPosts: (username) => request(`/user/${encodeURIComponent(username)}/posts`),
  updateUser: (body) => request('/user', { method: 'PATCH', body }),
  follow: (userIdent) => request(`/user/${encodeURIComponent(userIdent)}/follow`, { method: 'POST' }),
  unfollow: (userIdent) => request(`/user/${encodeURIComponent(userIdent)}/follow`, { method: 'DELETE' }),
  followers: (userIdent, page = 1) => request(`/user/${encodeURIComponent(userIdent)}/followers?page=${page}`),
  following: (userIdent, page = 1) => request(`/user/${encodeURIComponent(userIdent)}/following?page=${page}`),
  relationship: (userIdent) => request(`/user/${encodeURIComponent(userIdent)}/relationship`),

  getInbox: (page = 1) => request(`/inbox?page=${page}`),
  markInboxRead: (messageId) => request('/inbox', { method: 'PATCH', body: { message_id: messageId } }),

  getGuilds: (page = 1) => request(`/guilds?page=${page}`),
  getSubscribedGuilds: () => request('/guilds/subscribed'),
  createGuild: (name, description, icon, banner) => request('/guilds', { method: 'POST', body: { name, description, icon, banner } }),
  getGuildFeed: (guildId, page = 1) => request(`/guild/${guildId}?page=${page}`),
  updateGuild: (guildId, body) => request(`/guild/${guildId}`, { method: 'PATCH', body }),
  deleteGuild: (guildId) => request(`/guild/${guildId}`, { method: 'DELETE' }),
  postToChannel: (guildId, channelId, body) => request(`/guild/${guildId}/${channelId}`, { method: 'POST', body }),
  joinGuild: (guildId) => request(`/guild/${guildId}/join`, { method: 'POST' }),
  leaveGuild: (guildId) => request(`/guild/${guildId}/leave`, { method: 'DELETE' }),
  getMembers: (guildId) => request(`/guild/${guildId}/members`),

  getPostReplies: (guildId, postId) => request(`/guild/${guildId}/posts/${postId}/replies`),
  addPostReply: (guildId, postId, content, attachments = []) => request(`/guild/${guildId}/posts/${postId}/replies`, { method: 'POST', body: { content, attachments } }),

  getReactions: (guildId, postId) => request(`/guild/${guildId}/posts/${postId}/reactions`),
  addReaction: (guildId, postId, emoji) => request(`/guild/${guildId}/posts/${postId}/reactions`, { method: 'POST', body: { emoji } }),
  removeReaction: (guildId, postId, emoji) => request(`/guild/${guildId}/posts/${postId}/reactions`, { method: 'DELETE', body: { emoji } }),

  getEmojis: (guildId) => request(`/guild/${guildId}/emojis`),
  createEmoji: (guildId, name, url) => request(`/guild/${guildId}/emojis`, { method: 'POST', body: { name, url } }),
  deleteEmoji: (guildId, emojiId) => request(`/guild/${guildId}/emojis/${emojiId}`, { method: 'DELETE' }),

  getChannels: (guildId) => request(`/guild/channels/${guildId}`),
  createChannel: (guildId, name) => request('/guild/channels', { method: 'POST', body: { guildId, name } }),
  renameChannel: (guildId, channelId, name) => request(`/guild/channels/${guildId}`, { method: 'PATCH', body: { channelId, name } }),
  deleteChannel: (guildId, channelId) => request('/guild/channels', { method: 'DELETE', body: { guildId, channelId } }),

  getRoles: (guildId) => request(`/guild/${guildId}/roles`),
  createRole: (guildId, body) => request(`/guild/${guildId}/roles`, { method: 'POST', body }),
  assignRole: (guildId, roleId, userId) => request(`/guild/${guildId}/roles/${roleId}/members`, { method: 'POST', body: { userId } }),
  setChannelPermissions: (guildId, body) => request(`/guild/${guildId}/channel-permissions`, { method: 'PATCH', body }),

  guildDeletePost: (guildId, postId) => request(`/guild/${guildId}/moderation/delete-post`, { method: 'POST', body: { postId } }),
  guildKick: (guildId, userId, reason) => request(`/guild/${guildId}/moderation/kick`, { method: 'POST', body: { userId, reason } }),
  guildBan: (guildId, userId, durationSeconds, reason) => request(`/guild/${guildId}/moderation/ban`, { method: 'POST', body: { userId, durationSeconds, reason } }),

  getMyPermissions: () => request('/moderation/permissions'),
};

export { getAccessToken, getRefreshToken };
