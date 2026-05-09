import { type SaveIndicatorStatus } from "@repo/ui";

export type SaveStatusErrorOptions = {
  message: string;
  retry: () => void | Promise<void>;
};

export type SaveStatusChange = (
  status: SaveIndicatorStatus,
  errorOptions?: SaveStatusErrorOptions,
) => void;
