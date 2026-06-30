import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  normalizeWalletAddress,
  walletAddressFromIdentityData,
} from "@/lib/wallet-address";

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.");
  }

  return { url, publishableKey };
}

export async function getSupabaseServer() {
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies; proxy.ts refreshes sessions.
        }
      },
    },
  });
}

export async function getAuthenticatedUser() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return undefined;
  }

  return user;
}

export function getWalletFromUser(user: User | undefined) {
  const identityAddress = user?.identities
    ?.map((identity) => walletAddressFromIdentityData(identity.identity_data))
    .find(Boolean);

  return (
    identityAddress ??
    normalizeWalletAddress(user?.user_metadata?.address) ??
    normalizeWalletAddress(user?.user_metadata?.wallet_address)
  );
}

export async function syncUserProfile({
  user,
  walletAddress,
}: {
  user: User;
  walletAddress?: string;
}) {
  const normalizedWallet = normalizeWalletAddress(walletAddress) ?? getWalletFromUser(user);

  if (!normalizedWallet) {
    return undefined;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      wallet_address: normalizedWallet,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to sync user profile: ${error.message}`);
  }

  return normalizedWallet;
}

export async function getUserProfile(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user profile: ${error.message}`);
  }

  return data as { user_id: string; wallet_address: string; created_at: string; updated_at: string } | null;
}

export async function isAdminUser(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check admin role: ${error.message}`);
  }

  return Boolean(data);
}

export async function requireAdminUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { user: undefined, isAdmin: false };
  }

  return { user, isAdmin: await isAdminUser(user.id) };
}
