"use client";

import { useContext } from "react";

import { EditSessionContext } from "./edit-session-context";
import { type EditSessionContextValue } from "./types";

export const useEditSessionOrchestrator = (): EditSessionContextValue | null =>
  useContext(EditSessionContext);
