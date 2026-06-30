"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EthereumWallet } from "@supabase/auth-js";
import type { User } from "@supabase/supabase-js";
import { useConnection, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { baseChain } from "@/lib/wagmi-config";
import { findAvailableConnector, getWalletErrorMessage } from "@/lib/wallet-connector";
import {
  normalizeWalletAddress,
  walletAddressFromIdentityData,
} from "@/lib/wallet-address";

const baseChainId = 8453;

type AccountButtonProps = {
  tone?: "light" | "dark";
  variant?: "link" | "button";
  onAuthChange?: (isSignedIn: boolean) => void;
};

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

export function AccountButton({
  tone = "light",
  variant = "link",
  onAuthChange,
}: AccountButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const { address, chainId, connector, isConnected } = useConnection();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const supabase = getSupabaseBrowser();
  const walletAddress = walletFromUser(user);
  const isDark = tone === "dark";
  const onAuthChangeRef = useRef(onAuthChange);

  useEffect(() => {
    onAuthChangeRef.current = onAuthChange;
  }, [onAuthChange]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user);
        onAuthChangeRef.current?.(Boolean(data.user));
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      onAuthChangeRef.current?.(Boolean(session?.user));
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
      const { connector: activeConnector, provider } = await findAvailableConnector(
        connector,
        connectors,
      );

      const connection = isConnected
        ? { accounts: address ? [address] : [] }
        : await connectAsync({ connector: activeConnector, chainId: baseChain.id });

      if (chainId !== baseChain.id) {
        await switchChainAsync({ chainId: baseChain.id });
      }

      const { data, error: signInError } = await supabase.auth.signInWithWeb3({
        chain: "ethereum",
        wallet: provider as EthereumWallet,
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

      await fetch("/api/account/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: connection.accounts[0] }),
      });

      setUser(data.user);
    } catch (signInError) {
      setError(getWalletErrorMessage(signInError));
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    setError(undefined);
    setIsLoading(true);
    await supabase.auth.signOut();
    if (isConnected) {
      await disconnectAsync();
    }
    setUser(null);
    setIsLoading(false);
  }

  const buttonClass =
    variant === "button"
      ? "min-h-12 border border-[#171717] bg-[#171717] px-5 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#2b2b2b] disabled:cursor-wait disabled:bg-[#696969]"
      : `text-sm font-semibold uppercase tracking-[0.14em] underline underline-offset-4 ${
          isDark ? "text-white" : "text-[#171717]"
        } disabled:opacity-60`;

  const secondaryButtonClass =
    variant === "button"
      ? "text-sm font-semibold uppercase tracking-[0.14em] underline underline-offset-4 text-[#4a4a4a]"
      : `text-sm font-semibold uppercase tracking-[0.14em] underline underline-offset-4 ${
          isDark ? "text-white/70" : "text-[#4a4a4a]"
        }`;

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
          className={secondaryButtonClass}
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
    <div className={`flex flex-col gap-1 ${variant === "button" ? "items-stretch" : "items-end"}`}>
      <button
        className={buttonClass}
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
