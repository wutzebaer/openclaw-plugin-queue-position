export type QueuePositionState = "idle" | "queued" | "running";

export type QueuePosition = {
  available: boolean;
  state: QueuePositionState;
  position: number;
};

export type LaneEntry = {
  label: string;
};

export type LaneSnapshot = {
  available: boolean;
  active: number;
  waiting: number;
  truncated: boolean;
  entries: LaneEntry[];
};

export function formatPosition(report: QueuePosition): string {
  if (!report.available || report.state === "idle") return "";
  if (report.state === "running") return "läuft";
  if (report.position < 1) return "";
  return `Platz ${report.position} in Queue`;
}
