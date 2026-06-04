import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  type ArrangementAxis as ContractArrangementAxis,
  type Composition,
  compositionSchema,
  composeContainerSchema,
} from "@repo/contracts/lms/composition";

import type { ComposeContainer, NodeId } from "../compose-tree.types";

import { resolveArrangement } from "./arrangement-resolve";
import { draftContainerArbitrary } from "./compose-arbitraries";
import { type CreateSchemaPlanNode, composeRootToCreatePlan } from "./compose-to-create-requests";
import { asNodeId } from "./id-factory";

const NUM_RUNS = 300;
const CUID_BODY_LENGTH = 23;

const mountRoot = (child: ComposeContainer): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("roundtrip-root"),
  header: null,
  notes: null,
  children: [child],
});

const syntheticCuid = (index: number): string => {
  const digits = String(index).padStart(CUID_BODY_LENGTH, "0");

  return `ck${digits}`;
};

const buildCuidMap = (nodes: CreateSchemaPlanNode[]): Map<NodeId, string> => {
  const map = new Map<NodeId, string>();
  let counter = 0;

  const next = (): string => {
    counter += 1;

    return syntheticCuid(counter);
  };

  const walk = (node: CreateSchemaPlanNode): void => {
    map.set(node.draftNodeId, next());

    for (const entry of node.rows) {
      map.set(entry.draftNodeId, next());
    }

    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return map;
};

type FrozenRow = {
  nodeType: "row";
  id: string;
  rowKind: CreateSchemaPlanNode["rows"][number]["row"]["rowKind"];
  rowPayload: CreateSchemaPlanNode["rows"][number]["row"]["rowPayload"];
  reps: CreateSchemaPlanNode["rows"][number]["row"]["reps"];
  load: CreateSchemaPlanNode["rows"][number]["row"]["load"];
  side: CreateSchemaPlanNode["rows"][number]["row"]["side"];
  tempo: CreateSchemaPlanNode["rows"][number]["row"]["tempo"];
  position: CreateSchemaPlanNode["rows"][number]["row"]["position"];
  intensity: CreateSchemaPlanNode["rows"][number]["row"]["intensity"];
  notes: CreateSchemaPlanNode["rows"][number]["row"]["notes"];
};

type FrozenContainer = {
  nodeType: "container";
  id: string;
  header: string | null;
  notes: string | null;
  composition: Composition;
  children: (FrozenContainer | FrozenRow)[];
};

const requireCuid = (map: Map<NodeId, string>, id: NodeId): string => {
  const cuid = map.get(id);

  if (cuid === undefined) {
    throw new Error(`no synthetic cuid minted for ${id}`);
  }

  return cuid;
};

const foldComposition = (
  node: CreateSchemaPlanNode,
  map: Map<NodeId, string>,
): { composition: Composition; resolveOk: boolean } => {
  const base = node.schema.composition as Composition;

  if (node.deferredArrangement === undefined) {
    return { composition: base, resolveOk: true };
  }

  const resolved = resolveArrangement(node.deferredArrangement, map);

  if (!resolved.ok) {
    return { composition: base, resolveOk: false };
  }

  const arrangement: ContractArrangementAxis = resolved.arrangement;

  return { composition: { ...base, arrangement }, resolveOk: true };
};

const projectRow = (
  entry: CreateSchemaPlanNode["rows"][number],
  map: Map<NodeId, string>,
): FrozenRow => {
  const { row } = entry;

  return {
    nodeType: "row",
    id: requireCuid(map, entry.draftNodeId),
    rowKind: row.rowKind,
    rowPayload: row.rowPayload,
    reps: row.reps ?? null,
    load: row.load ?? null,
    side: row.side ?? null,
    tempo: row.tempo ?? null,
    position: row.position ?? null,
    intensity: row.intensity ?? null,
    notes: row.notes ?? null,
  };
};

const projectContainer = (
  node: CreateSchemaPlanNode,
  map: Map<NodeId, string>,
): { container: FrozenContainer; resolveOk: boolean } => {
  const { composition, resolveOk } = foldComposition(node, map);
  const childResults = node.children.map((child) => projectContainer(child, map));
  const rows = node.rows.map((entry) => projectRow(entry, map));

  return {
    container: {
      nodeType: "container",
      id: requireCuid(map, node.draftNodeId),
      header: node.schema.header ?? null,
      notes: node.schema.notes ?? null,
      composition,
      children: [...childResults.map((result) => result.container), ...rows],
    },
    resolveOk: resolveOk && childResults.every((result) => result.resolveOk),
  };
};

const eachComposition = (nodes: CreateSchemaPlanNode[]): Composition[] => {
  const out: Composition[] = [];

  const walk = (node: CreateSchemaPlanNode): void => {
    out.push(node.schema.composition as Composition);
    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return out;
};

describe("composeRootToCreatePlan round-trip property (QA-501, design §5.7)", () => {
  it("rejects every deliberately-invalid arrangement tree with an arrangement-pathed issue", () => {
    fc.assert(
      fc.property(draftContainerArbitrary(), ({ container, isInvalid }) => {
        fc.pre(isInvalid);

        const result = composeRootToCreatePlan(mountRoot(container));

        expect(result.ok).toBe(false);

        if (!result.ok) {
          const arrangementIssues = result.issues.filter(
            (issue) => issue.path.includes("composition") && issue.path.includes("arrangement"),
          );

          expect(arrangementIssues.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("emits only frozen-valid phase-1 compositions and round-trips resolvable trees", () => {
    fc.assert(
      fc.property(draftContainerArbitrary(), ({ container, isInvalid }) => {
        fc.pre(!isInvalid);

        const result = composeRootToCreatePlan(mountRoot(container));

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        for (const composition of eachComposition(result.nodes)) {
          expect(composition).not.toHaveProperty("arrangement");
          expect(compositionSchema.safeParse(composition).success).toBe(true);
        }

        const map = buildCuidMap(result.nodes);

        for (const node of result.nodes) {
          const { container: projected, resolveOk } = projectContainer(node, map);

          expect(resolveOk).toBe(true);
          expect(compositionSchema.safeParse(projected.composition).success).toBe(true);

          const parsed = composeContainerSchema.safeParse(projected);

          if (!parsed.success) {
            throw new Error(
              `projected container failed composeContainerSchema: ${JSON.stringify(parsed.error.issues)}`,
            );
          }

          expect(parsed.success).toBe(true);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("folds the resolved arrangement into the projected composition for arrangement-bearing trees", () => {
    fc.assert(
      fc.property(draftContainerArbitrary(), ({ container, isInvalid }) => {
        fc.pre(!isInvalid);

        const result = composeRootToCreatePlan(mountRoot(container));

        if (!result.ok) {
          return;
        }

        const deferredNodes: CreateSchemaPlanNode[] = [];

        const walk = (node: CreateSchemaPlanNode): void => {
          if (node.deferredArrangement !== undefined) {
            deferredNodes.push(node);
          }

          node.children.forEach(walk);
        };

        result.nodes.forEach(walk);
        fc.pre(deferredNodes.length > 0);

        const map = buildCuidMap(result.nodes);

        for (const node of result.nodes) {
          projectContainer(node, map);
        }

        const target = deferredNodes[0];

        if (target === undefined) {
          return;
        }

        const { composition } = foldComposition(target, map);

        expect(composition.arrangement).toBeDefined();
        expect(arrangementAxisCuidShaped(composition.arrangement)).toBe(true);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

const arrangementAxisCuidShaped = (arrangement: ContractArrangementAxis | undefined): boolean => {
  if (arrangement === undefined) {
    return false;
  }

  return compositionSchema.safeParse({ arrangement }).success;
};
