import { UsersAPI, type UserProfile } from './api';

let usersCache: Map<string, UserProfile> = new Map();
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export async function initUsers(): Promise<void> {
  if (loaded && usersCache.size > 0) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const users = await UsersAPI.list();
    usersCache = new Map(users.map(u => [u.discord_id, u]));
    loaded = true;
  })();
  return loadingPromise;
}

export function getUserByDiscordId(discordId: string): { discordId: string; username: string; displayName: string; avatar: string } | null {
  const u = usersCache.get(discordId);
  if (!u) return null;
  return {
    discordId: u.discord_id,
    username: u.username,
    displayName: u.display_name,
    avatar: u.avatar || '',
  };
}

export async function searchUsersDisplayName(q: string): Promise<Array<{ discordId: string; username: string; displayName: string; avatar: string }>> {
  const list = await UsersAPI.list({ search: q });
  return list.map(u => ({
    discordId: u.discord_id,
    username: u.username,
    displayName: u.display_name,
    avatar: u.avatar || '',
  }));
}
