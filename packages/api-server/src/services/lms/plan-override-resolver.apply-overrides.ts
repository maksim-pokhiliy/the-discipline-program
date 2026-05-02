import { type PlanOverride } from "@prisma/client";

import { planOverridePayloadSchema, PlanOverrideKind } from "@repo/contracts/lms/plan-override";
import { logger } from "@repo/shared";

import { type EffectiveNode, baseNode } from "./plan-override-resolver.types";

export type AppliedCounts = Record<string, number>;

const incrementKind = (counts: AppliedCounts, kind: string): void => {
  counts[kind] = (counts[kind] ?? 0) + 1;
};

const applyOverrideToNode = (
  node: EffectiveNode,
  overrideId: string,
  kind: string,
  payload: unknown,
  counts: AppliedCounts,
): void => {
  if (node.suspended) {
    return;
  }

  const parsed = planOverridePayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return;
  }

  const data = parsed.data;

  switch (data.kind) {
    case "REPLACE": {
      node.isOverridden = true;
      node.overrideKind = PlanOverrideKind.REPLACE;
      incrementKind(counts, "REPLACE");
      break;
    }
    case "APPEND": {
      node.isOverridden = true;
      node.overrideKind = PlanOverrideKind.APPEND;
      incrementKind(counts, "APPEND");
      break;
    }
    case "SUSPEND": {
      node.isOverridden = true;
      node.overrideKind = PlanOverrideKind.SUSPEND;
      node.suspended = true;
      incrementKind(counts, "SUSPEND");
      break;
    }
    case "NOTE": {
      node.isOverridden = true;
      node.overrideKind = PlanOverrideKind.NOTE;
      node.notes = [...node.notes, data.markdown];
      incrementKind(counts, "NOTE");
      break;
    }
    default: {
      void (data satisfies never);
      logger.warn("lms.plan_override.unknown_kind", { overrideId, kind });
      break;
    }
  }
};

export const buildNodeMap = (
  overrides: PlanOverride[],
): { nodeMap: Map<string, EffectiveNode>; counts: AppliedCounts } => {
  const nodeMap = new Map<string, EffectiveNode>();
  const counts: AppliedCounts = {};

  for (const override of overrides) {
    const existing = nodeMap.get(override.scopeId);
    const node = existing ?? baseNode();

    if (!existing) {
      nodeMap.set(override.scopeId, node);
    }

    applyOverrideToNode(node, override.id, override.kind, override.payload, counts);
  }

  return { nodeMap, counts };
};

export type AppendedEntry = EffectiveNode & { id: string; order: number };

export const buildAppendedEntries = (
  overrides: PlanOverride[],
  scopeId: string,
  baseEntriesCount: number,
): AppendedEntry[] => {
  return overrides
    .filter((o) => o.scopeId === scopeId)
    .flatMap((o) => {
      const parsed = planOverridePayloadSchema.safeParse(o.payload);

      if (parsed.success && parsed.data.kind === "APPEND") {
        return parsed.data.entries.map((entry, idx) => ({
          ...baseNode(),
          id: entry.id,
          order: baseEntriesCount + idx,
        }));
      }

      return [];
    });
};
