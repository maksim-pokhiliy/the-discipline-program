import { type SaveIndicatorStatus } from "@repo/ui";

export type SaveStatusChange = (status: SaveIndicatorStatus, error?: Error) => void;
