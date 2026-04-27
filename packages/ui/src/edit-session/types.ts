import { type SafeParseReturnType } from "zod";

export type EditSessionStatus =
  | "idle"
  | "dirty"
  | "dirty-invalid"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

export type ConflictState = {
  currentVersion: number;
};

export type UseEditSessionConfig<TDraft> = {
  sessionId: string;
  initial: TDraft;
  expectedVersion: number;
  validate: (draft: TDraft) => SafeParseReturnType<TDraft, TDraft>;
  mutationKey: readonly unknown[];
  mutationFn: (draft: TDraft, expectedVersion: number) => Promise<TDraft>;
  label?: string;
  idleSaveMs?: number;
  savedFadeMs?: number;
  onSaved?: (next: TDraft) => void;
  onConflict?: (currentVersion: number) => void;
};

export type UseEditSessionApi<TDraft> = {
  sessionId: string;
  draft: TDraft;
  dispatch: (next: TDraft | ((prev: TDraft) => TDraft)) => void;
  status: EditSessionStatus;
  isDirty: boolean;
  isValid: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  conflict: ConflictState | null;
  error: Error | null;
  expectedVersion: number;
  save: () => Promise<void>;
  discard: () => void;
  reset: (next: TDraft, version?: number) => void;
};

export type EditSessionRegistration = {
  sessionId: string;
  label?: string;
  status: EditSessionStatus;
  isDirty: boolean;
  isValid: boolean;
  save: () => Promise<void>;
  discard: () => void;
};

export type FlushAllResult = {
  flushed: string[];
  blocked: string[];
};

export type RouteChangeFlushResult = "proceed" | "cancel";

export type EditSessionContextValue = {
  register: (registration: EditSessionRegistration) => void;
  unregister: (sessionId: string) => void;
  getDirtySessions: () => EditSessionRegistration[];
  flushAll: () => Promise<FlushAllResult>;
  flushSession: (sessionId: string) => Promise<void>;
  requestRouteChangeFlush: () => Promise<RouteChangeFlushResult>;
};
