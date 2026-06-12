import { createClient as createBaseClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createBaseClient> | null = null;

export const supabaseAdmin = () => {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dldetblriapomxthlkdn.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  cached = createBaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
};
