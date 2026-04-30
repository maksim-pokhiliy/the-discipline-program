"use client";

import { toast } from "sonner";

export type ValidationIssue = {
  path: string;
  message: string;
};

export const getIssues = (error: unknown): ValidationIssue[] | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const details = (error as { details?: unknown }).details;

  if (!details || typeof details !== "object") {
    return undefined;
  }

  const issues = (details as Record<string, unknown>).issues;

  if (!Array.isArray(issues)) {
    return undefined;
  }

  const normalized: ValidationIssue[] = [];

  for (const candidate of issues) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const message = (candidate as { message?: unknown }).message;

    if (typeof message !== "string") {
      continue;
    }

    const path = (candidate as { path?: unknown }).path;

    normalized.push({
      path: typeof path === "string" ? path : "",
      message,
    });
  }

  return normalized.length > 0 ? normalized : undefined;
};

export const notifyError = (error: unknown, fallback: string): void => {
  const issues = getIssues(error);

  if (issues) {
    for (const issue of issues) {
      toast.error(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
    }

    return;
  }

  if (error instanceof Error && error.message) {
    toast.error(error.message);

    return;
  }

  toast.error(fallback);
};
