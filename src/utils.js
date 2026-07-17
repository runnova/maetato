export function initials(name = '') {
  const text = name.trim().slice(0, 2);
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '?';
}

export function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'now';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function parseLikedUsers(usersLiked, myUuid) {
  try {
    const arr = typeof usersLiked === 'string' ? JSON.parse(usersLiked) : (usersLiked || []);
    return { count: arr.length, likedByMe: myUuid ? arr.includes(myUuid) : false };
  } catch {
    return { count: 0, likedByMe: false };
  }
}
