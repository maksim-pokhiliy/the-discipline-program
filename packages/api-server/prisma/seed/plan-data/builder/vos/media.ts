import type { MediaReference } from "@repo/contracts/lms/_shared";

export type MediaInput = {
  url: string;
  label?: string;
};

export const mediaReference = (input: MediaInput): MediaReference =>
  input.label === undefined ? { url: input.url } : { url: input.url, label: input.label };
