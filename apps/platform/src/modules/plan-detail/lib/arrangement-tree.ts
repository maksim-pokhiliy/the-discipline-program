import type { ComposeContainer, ComposeRow } from "../components/axes/axis-draft.types";

export const collectTrackChildren = (container: ComposeContainer): ComposeContainer[] =>
  container.children.filter((child): child is ComposeContainer => child.nodeType === "container");

export const collectDirectRows = (container: ComposeContainer): ComposeRow[] =>
  container.children.filter((child): child is ComposeRow => child.nodeType === "row");
