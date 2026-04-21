import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

if (url && key) {
  client = createClient(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
} else if (import.meta.env.DEV) {
  console.warn(
    '[review] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Review Mode will be disabled. Copy web/.env.local.example to web/.env.local and fill them in.',
  );
}

export const supabase = client;

export const isReviewConfigured = (): boolean => client !== null;
