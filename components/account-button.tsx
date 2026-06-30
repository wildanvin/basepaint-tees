"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  normalizeWalletAddress,
  walletAddressFromIdentityData,
} from "@/lib/wallet-address";

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const baseChainId = 8453;

function shortAddress(address?: string | null) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Account";
}

function walletFromUser(user?: User | null) {
  const identity = user?.identities
    ?.map((item) => walletAddressFromIdentityData(item.identity_data))
    .find(Boolean);

  return (
    identity ??
    normalizeWalletAddress(user?.user_metadata?.address) ??
    normalizeWalletAddress(user?.user_metadata?.wallet_address)
  );
}

async function switchToBase() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Install a wallet that supports Base.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }],
    });
  } catch {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x2105",
          chainName: "Base",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://mainnet.base.org"],
          blockExplorerUrls: ["https://basescan.org"],
        },
      ],
    });
  }
}

export function AccountButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const supabase = getSupabaseBrowser();
  const walletAddress = walletFromUser(user);
  const isDark = tone === "dark";

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  async function signIn() {
    setError(undefined);
    setIsLoading(true);

    try {
      await switchToBase();

      const { data, error: signInError } = await supabase.auth.signInWithWeb3({
        chain: "ethereum",
        statement: "Sign in to BasePaint Tees on Base.",
        options: {
          signInWithEthereum: {
            chainId: baseChainId,
          },
        },
      });

      if (signInError) {
        throw signInError;
      }

      const accounts = (await window.ethereum?.request({
        method: "eth_requestAccounts",
      })) as string[] | undefined;

      await fetch("/api/account/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: accounts?.[0] }),
      });

      setUser(data.user);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    setError(undefined);
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  }

  if (user) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          className={`text-sm font-semibold uppercase tracking-[0.14em] underline underline-offset-4 ${
            isDark ? "text-white" : "text-[#171717]"
          }`}
          href="/account"
        >
          {shortAddress(walletAddress)}
        </Link>
        <button
          className={`text-sm font-semibold uppercase tracking-[0.14em] underline underline-offset-4 ${
            isDark ? "text-white/70" : "text-[#4a4a4a]"
          }`}
          disabled={isLoading}
          onClick={signOut}
          type="button"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className={`text-sm font-semibold uppercase tracking-[0.14em] underline underline-offset-4 ${
          isDark ? "text-white" : "text-[#171717]"
        } disabled:opacity-60`}
        disabled={isLoading}
        onClick={signIn}
        type="button"
      >
        {isLoading ? "Checking..." : "Sign in"}
      </button>
      {error ? <p className="max-w-64 text-right text-xs text-[#ff4d6d]">{error}</p> : null}
    </div>
  );
}
