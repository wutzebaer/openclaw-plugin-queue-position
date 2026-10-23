import type { LaneSnapshot, QueuePosition } from "./report.js";

const MAX_CALLS = 200;
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

export type ModelCall = {
  callId: string;
  sessionKey: string;
  at: number;
};

const calls: ModelCall[] = [];

function prune(now: number): void {
  for (let index = calls.length - 1; index >= 0; index -= 1) {
    if (now - calls[index].at > MAX_AGE_MS) calls.splice(index, 1);
  }
}

export function resetModelCalls(): void {
  calls.length = 0;
}

export function noteModelCallStarted(call: ModelCall, now = Date.now()): void {
  prune(now);
  if (!call.callId || calls.some((item) => item.callId === call.callId)) return;
  calls.push({ callId: call.callId, sessionKey: call.sessionKey.trim(), at: call.at });
  if (calls.length > MAX_CALLS) calls.splice(0, calls.length - MAX_CALLS);
}

export function noteModelCallEnded(callId: string): void {
  const index = calls.findIndex((call) => call.callId === callId);
  if (index >= 0) calls.splice(index, 1);
}

export function readModelQueuePosition(sessionKey: string, now = Date.now()): QueuePosition {
  prune(now);
  const cleaned = sessionKey.trim();
  const index = cleaned ? calls.findIndex((call) => call.sessionKey === cleaned) : -1;
  if (index < 0) return { available: true, state: "idle", position: 0 };
  if (index === 0) return { available: true, state: "running", position: 0 };
  return { available: true, state: "queued", position: index };
}

function shortLabel(sessionKey: string): string {
  if (!sessionKey) return "ohne Zuordnung";
  const tail = sessionKey.split(":").pop() ?? sessionKey;
  return tail.length > 8 ? `…${tail.slice(-8)}` : tail;
}

export function readModelLane(now = Date.now()): LaneSnapshot {
  prune(now);
  const visible = calls.slice(0, 40);
  return {
    available: true,
    active: calls.length > 0 ? 1 : 0,
    waiting: Math.max(0, calls.length - 1),
    truncated: calls.length > visible.length,
    entries: visible.map((call, index) => ({
      label:
        index === 0
          ? `läuft · ${shortLabel(call.sessionKey)}`
          : `Platz ${index} · ${shortLabel(call.sessionKey)}`,
    })),
  };
}

export function modelCallFromHook(event: unknown, context: unknown): ModelCall | undefined {
  const record = (value: unknown): Record<string, unknown> | undefined =>
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
  const payload = record(event);
  const ctx = record(context);
  const callId = payload?.callId;
  if (typeof callId !== "string" || !callId.trim()) return undefined;
  const sessionKey = payload?.sessionKey ?? ctx?.sessionKey ?? payload?.sessionId ?? ctx?.sessionId;
  return {
    callId: callId.trim(),
    sessionKey: typeof sessionKey === "string" ? sessionKey : "",
    at: Date.now(),
  };
}
