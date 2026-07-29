import { reviewApiBaseUrl } from './supabaseClient';
import type { Anchor, Comment, Thread, ThreadWithComments } from './types';

interface CreateThreadResult {
  thread: Thread;
  comment: Comment;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!reviewApiBaseUrl) throw new Error('Review API is not configured');

  const response = await fetch(`${reviewApiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!response.ok) {
    throw new Error(payload.error || `Review request failed (${response.status})`);
  }
  return payload;
};

export const listReviewThreads = async (
  route?: string,
): Promise<ThreadWithComments[]> => {
  const query = route ? `?route=${encodeURIComponent(route)}` : '';
  const data = await request<{ threads: ThreadWithComments[] }>(`/threads${query}`);
  return data.threads;
};

export const createReviewThread = async (
  route: string,
  anchor: Anchor,
  authorName: string,
  body: string,
): Promise<CreateThreadResult> =>
  request<CreateThreadResult>('/threads', {
    method: 'POST',
    body: JSON.stringify({
      route,
      selector: anchor.selector,
      x_ratio: anchor.xRatio,
      y_ratio: anchor.yRatio,
      element_label: anchor.label,
      author_name: authorName,
      body,
    }),
  });

export const addReviewReply = async (
  threadId: string,
  authorName: string,
  body: string,
): Promise<Comment> => {
  const data = await request<{ comment: Comment }>(
    `/threads/${encodeURIComponent(threadId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ author_name: authorName, body }),
    },
  );
  return data.comment;
};

export const updateReviewThreadStatus = async (
  threadId: string,
  status: 'open' | 'resolved',
): Promise<Thread> => {
  const data = await request<{ thread: Thread }>(
    `/threads/${encodeURIComponent(threadId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
  return data.thread;
};
