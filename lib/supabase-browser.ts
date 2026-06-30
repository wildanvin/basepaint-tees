"use client";

import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.");
  }

  return createBrowserClient(url, publishableKey);
}
