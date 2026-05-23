import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertSupabaseStorageReady,
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/config-env";

let cachedAdmin: SupabaseClient | null = null;

/** Server-only Supabase client (service role). Used for Storage uploads. */
export function getSupabaseStorageAdmin(): SupabaseClient {
  assertSupabaseStorageReady();
  if (!cachedAdmin) {
    cachedAdmin = createClient(getSupabaseProjectUrl()!, getSupabaseServiceRoleKey()!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedAdmin;
}

/** Test helper — reset singleton between tests. */
export function resetSupabaseStorageAdminForTests(): void {
  cachedAdmin = null;
}
