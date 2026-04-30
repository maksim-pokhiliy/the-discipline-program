"use client";

import { createContext } from "react";

import { type EditSessionContextValue } from "./types";

export const EditSessionContext = createContext<EditSessionContextValue | null>(null);
