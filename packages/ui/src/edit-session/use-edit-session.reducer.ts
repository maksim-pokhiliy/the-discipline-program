import { type EditSessionStatus } from "./types";

export type EditSessionInternalState<TDraft> = {
  initial: TDraft;
  draft: TDraft;
  status: EditSessionStatus;
  isDirty: boolean;
  isValid: boolean;
  expectedVersion: number;
  lastSavedAt: Date | null;
  conflict: { currentVersion: number } | null;
  error: Error | null;
};

export type EditSessionAction<TDraft> =
  | { type: "dispatch-valid"; draft: TDraft }
  | { type: "dispatch-invalid"; draft: TDraft }
  | { type: "dispatch-clean"; draft: TDraft }
  | { type: "save-start" }
  | { type: "save-success"; next: TDraft; nextVersion: number; savedAt: Date }
  | { type: "save-failure"; error: Error }
  | { type: "save-conflict"; currentVersion: number }
  | { type: "saved-fade" }
  | { type: "discard" }
  | { type: "reset"; draft: TDraft; version?: number };

export const ALLOWED_EDIT_SESSION_ACTION_TYPES: ReadonlyArray<EditSessionAction<unknown>["type"]> =
  [
    "dispatch-valid",
    "dispatch-invalid",
    "dispatch-clean",
    "save-start",
    "save-success",
    "save-failure",
    "save-conflict",
    "saved-fade",
    "discard",
    "reset",
  ];

export const createInitialState = <TDraft>(
  initial: TDraft,
  expectedVersion: number,
): EditSessionInternalState<TDraft> => ({
  initial,
  draft: initial,
  status: "idle",
  isDirty: false,
  isValid: true,
  expectedVersion,
  lastSavedAt: null,
  conflict: null,
  error: null,
});

export const editSessionReducer = <TDraft>(
  state: EditSessionInternalState<TDraft>,
  action: EditSessionAction<TDraft>,
): EditSessionInternalState<TDraft> => {
  switch (action.type) {
    case "dispatch-clean":
      return {
        ...state,
        draft: action.draft,
        status: "idle",
        isDirty: false,
        isValid: true,
        error: null,
        conflict: null,
      };
    case "dispatch-valid":
      return {
        ...state,
        draft: action.draft,
        status: "dirty",
        isDirty: true,
        isValid: true,
        error: null,
        conflict: null,
      };
    case "dispatch-invalid":
      return {
        ...state,
        draft: action.draft,
        status: "dirty-invalid",
        isDirty: true,
        isValid: false,
        error: null,
        conflict: null,
      };
    case "save-start":
      if (state.status !== "dirty") {
        return state;
      }

      return {
        ...state,
        status: "saving",
        error: null,
        conflict: null,
      };
    case "save-success":
      return {
        ...state,
        initial: action.next,
        draft: action.next,
        status: "saved",
        isDirty: false,
        isValid: true,
        expectedVersion: action.nextVersion,
        lastSavedAt: action.savedAt,
        error: null,
        conflict: null,
      };
    case "save-failure":
      return {
        ...state,
        status: "error",
        error: action.error,
      };
    case "save-conflict":
      return {
        ...state,
        status: "conflict",
        conflict: { currentVersion: action.currentVersion },
        error: null,
      };
    case "saved-fade":
      if (state.status !== "saved") {
        return state;
      }

      return { ...state, status: "idle" };
    case "discard":
      return {
        ...state,
        draft: state.initial,
        status: "idle",
        isDirty: false,
        isValid: true,
        error: null,
        conflict: null,
      };
    case "reset":
      return {
        initial: action.draft,
        draft: action.draft,
        status: "idle",
        isDirty: false,
        isValid: true,
        expectedVersion: action.version ?? state.expectedVersion,
        lastSavedAt: state.lastSavedAt,
        conflict: null,
        error: null,
      };
  }
};
