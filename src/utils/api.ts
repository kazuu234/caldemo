export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";

export interface Trip {
  id: string;
  type: 'trip' | 'meetup';
  user_discord_id: string;
  user_name: string;
  user_avatar?: string;
  country: string;
  city: string;
  start_date: string; // ISO date
  end_date: string;   // ISO date
  description?: string;
  is_recruitment?: boolean;
  recruitment_details?: string;
  min_participants?: number | null;
  max_participants?: number | null;
  participants?: string[];
  is_hidden?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationItem {
  id: string;
  user_discord_id: string;
  trip?: string | null;
  type: 'recruitment' | 'day_before' | 'same_day' | 'comment' | 'other';
  title?: string;
  message?: string;
  created_at: string;
  read_at?: string | null;
  unread?: boolean;
}

export interface CommentItem {
  id: string;
  trip: string;
  user_discord_id: string;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DateProposalItem {
  id: string;
  trip: string;
  date: string; // ISO date
  created_by_discord_id: string;
  created_at: string;
  votes_count?: number;
}

export interface DateVoteItem {
  id: string;
  proposal: string;
  user_discord_id: string;
  created_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// Trips
export const TripsAPI = {
  list(params?: Record<string, string | number | boolean | undefined>) {
    const query = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as any).toString()
      : '';
    return request<Trip[]>(`/trips/${query}`);
  },
  retrieve(id: string) {
    return request<Trip>(`/trips/${id}/`);
  },
  create(payload: Partial<Trip>) {
    return request<Trip>(`/trips/`, { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id: string, payload: Partial<Trip>) {
    return request<Trip>(`/trips/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id: string) {
    return request<void>(`/trips/${id}/`, { method: 'DELETE' });
  },
  join(id: string, discord_id: string) {
    return request<Trip>(`/trips/${id}/join/`, { method: 'POST', body: JSON.stringify({ discord_id }) });
  },
  leave(id: string, discord_id: string) {
    return request<Trip>(`/trips/${id}/leave/`, { method: 'POST', body: JSON.stringify({ discord_id }) });
  },
  toggleRecruitment(id: string, is_recruitment?: boolean) {
    return request<Trip>(`/trips/${id}/toggle_recruitment/`, { method: 'POST', body: JSON.stringify({ is_recruitment }) });
  },
  endRecruitment(id: string) {
    return request<Trip>(`/trips/${id}/end_recruitment/`, { method: 'POST' });
  },
  toggleHidden(id: string, is_hidden?: boolean) {
    return request<Trip>(`/trips/${id}/toggle_hidden/`, { method: 'POST', body: JSON.stringify({ is_hidden }) });
  },
};

// Notifications
export const NotificationsAPI = {
  list(user_discord_id: string, unread_only?: boolean) {
    const q = new URLSearchParams({ user_discord_id, ...(unread_only ? { unread_only: 'true' } : {}) });
    return request<NotificationItem[]>(`/notifications/?${q.toString()}`);
  },
  count(user_discord_id: string) {
    const q = new URLSearchParams({ user_discord_id });
    return request<{ total: number; unread: number }>(`/notifications/count?${q.toString()}`);
  },
  markRead(id: string) {
    return request<NotificationItem>(`/notifications/${id}/mark_read/`, { method: 'POST' });
  },
  markAllRead(user_discord_id: string) {
    return request<{ status: 'ok' }>(`/notifications/mark_all_read/`, { method: 'POST', body: JSON.stringify({ user_discord_id }) });
  },
};

// Comments
export const CommentsAPI = {
  list(tripId: string) {
    const q = new URLSearchParams({ trip: tripId });
    return request<CommentItem[]>(`/comments/?${q.toString()}`);
  },
  create(payload: Pick<CommentItem, 'trip' | 'user_discord_id' | 'user_name' | 'content'>) {
    return request<CommentItem>(`/comments/`, { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id: string, payload: Partial<Pick<CommentItem, 'content'>>> ) {
    return request<CommentItem>(`/comments/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id: string) {
    return request<void>(`/comments/${id}/`, { method: 'DELETE' });
  },
};

// Date Proposals & Votes
export const DateProposalsAPI = {
  list(tripId: string) {
    const q = new URLSearchParams({ trip: tripId });
    return request<DateProposalItem[]>(`/date_proposals/?${q.toString()}`);
  },
  create(payload: Pick<DateProposalItem, 'trip' | 'date' | 'created_by_discord_id'>) {
    return request<DateProposalItem>(`/date_proposals/`, { method: 'POST', body: JSON.stringify(payload) });
  },
  remove(id: string) {
    return request<void>(`/date_proposals/${id}/`, { method: 'DELETE' });
  },
  votes(id: string) {
    return request<DateVoteItem[]>(`/date_proposals/${id}/votes/`);
  },
  vote(id: string, user_discord_id: string) {
    return request<DateVoteItem>(`/date_proposals/${id}/vote/`, { method: 'POST', body: JSON.stringify({ user_discord_id }) });
  },
  unvote(id: string, user_discord_id: string) {
    return request<{ status: 'ok' }>(`/date_proposals/${id}/unvote/`, { method: 'POST', body: JSON.stringify({ user_discord_id }) });
  },
};
