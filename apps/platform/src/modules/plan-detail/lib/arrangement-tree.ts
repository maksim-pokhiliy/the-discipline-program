import type { ComposeContainer, ComposeRow } from "../components/axes/axis-draft.types";

export const collectTrackChildren = (container: ComposeContainer): ComposeContainer[] =>
  container.children.filter((child): child is ComposeContainer => child.nodeType === "container");

export const collectDirectRows = (container: ComposeContainer): ComposeRow[] =>
  container.children.filter((child): child is ComposeRow => child.nodeType === "row");

export const collectDescendantRows = (container: ComposeContainer): ComposeRow[] => {
  const rows: ComposeRow[] = [];

  const walk = (node: ComposeContainer): void => {
    for (const child of node.children) {
      if (child.nodeType === "row") {
        rows.push(child);

        continue;
      }

      walk(child);
    }
  };

  walk(container);

  return rows;
};
