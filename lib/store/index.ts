import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

const useLocal =
  process.env.STORAGE_BACKEND === "local" ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY;

export const store: Store = useLocal ? localStore : supabaseStore;

export const usingLocalBackend = useLocal;
