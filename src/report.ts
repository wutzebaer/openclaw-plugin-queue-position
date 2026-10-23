export type QueuePositionState = "idle" | "queued" | "running";

export type QueuePosition = {
  available: boolean;
  state: QueuePositionState;
  position: number;
};

export type LaneEntry = {
  state: "running" | "queued";
  position: number;
  label: string;
};

export type LaneSnapshot = {
  available: boolean;
  active: number;
  waiting: number;
  truncated: boolean;
  entries: LaneEntry[];
};
