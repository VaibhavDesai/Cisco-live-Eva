import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const configuredReviewApiUrl = import.meta.env.VITE_REVIEW_API_URL as
  | string
  | undefined;

let client: SupabaseClient | null = null;

if (url && key) {
  client = createClient(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
}

export const supabase = client;

export const reviewApiBaseUrl = configuredReviewApiUrl
  ? configuredReviewApiUrl.replace(/\/$/, '')
  : import.meta.env.DEV
    ? '/api/review'
    : null;

export const isReviewConfigured = (): boolean =>
  client !== null || reviewApiBaseUrl !== null;
