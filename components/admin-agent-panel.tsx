"use client";

import { useState } from "react";
import type { AgentRun } from "@/lib/product-store";

type AgentResponse = {
  ok: boolean;
  run?: AgentRun;
  error?: string;
};

type PollResponse = {
  checked?: number;
  error?: string;
};

export function AdminAgentPanel({ initialRuns }: { initialRuns: AgentRun[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [isRunning, setIsRunning] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pollMessage, setPollMessage] = useState<string | undefined>();

  async function runAgent() {
    setIsRunning(true);
    setError(undefined);

    try {
      const response = await fetch("/api/agent/run", { method: "POST" });
      const payload = (await response.json()) as AgentResponse;

      if (!response.ok || !payload.ok || !payload.run) {
        throw new Error(payload.error ?? "Agent run failed.");
      }

      setRuns((currentRuns) => [payload.run!, ...currentRuns].slice(0, 10));
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Agent run failed.");
    } finally {
      setIsRunning(false);
    }
  }

  async function pollPayments() {
    setIsPolling(true);
    setError(undefined);
    setPollMessage(undefined);

    try {
      const response = await fetch("/api/payments/poll", { method: "POST" });
      const payload = (await response.json()) as PollResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Payment polling failed.");
      }

      setPollMessage(`Checked ${payload.checked ?? 0} recent transfers. Refresh admin for updates.`);
    } catch (pollError) {
      setError(pollError instanceof Error ? pollError.message : "Payment polling failed.");
    } finally {
      setIsPolling(false);
    }
  }

  return (
    <section className="mt-8 border border-white/20 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#41c7ff]">
            Daily operator
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Product sync
          </h2>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center border border-[#41c7ff] bg-[#41c7ff] px-5 text-sm font-bold uppercase tracking-[0.14em] text-black disabled:cursor-wait disabled:opacity-60"
          disabled={isRunning}
          onClick={runAgent}
          type="button"
        >
          {isRunning ? "Running..." : "Run daily sync"}
        </button>
        <button
          className="inline-flex min-h-12 items-center justify-center border border-white/30 px-5 text-sm font-bold uppercase tracking-[0.14em] text-white disabled:cursor-wait disabled:opacity-60"
          disabled={isPolling}
          onClick={pollPayments}
          type="button"
        >
          {isPolling ? "Checking..." : "Poll payments"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {pollMessage ? (
        <p className="mt-4 border border-[#41c7ff]/40 bg-[#41c7ff]/10 p-3 text-sm text-[#dff8ff]">
          {pollMessage}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {runs.length === 0 ? (
          <p className="text-sm text-white/55">No agent runs yet.</p>
        ) : (
          runs.map((run) => (
            <article className="border border-white/10 p-4" key={run.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                  {run.status} · BasePaint #{run.basepaintDay}
                </p>
                <time className="text-xs uppercase tracking-[0.14em] text-white/45">
                  {new Date(run.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-2 text-sm text-white/70">{run.message}</p>
              {run.product ? (
                <pre className="mt-3 max-h-72 overflow-auto bg-black/50 p-3 text-xs text-white/70">
                  {JSON.stringify(run.product, null, 2)}
                </pre>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
