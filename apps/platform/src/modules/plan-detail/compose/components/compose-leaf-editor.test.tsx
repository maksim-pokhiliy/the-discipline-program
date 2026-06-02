import { type ReactElement, useState } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Load } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { MOCK_EXERCISE_IDS } from "../compose-mock-exercises";
import type { ComposeNode, ComposeRow, NodeId } from "../compose-tree.types";
import { asNodeId } from "../lib/id-factory";
import { isRowCommitted } from "../lib/make-row";
import { updateNode } from "../lib/tree-ops";

import { ComposeLeafEditor } from "./compose-leaf-editor";
import { ComposeProviderShell } from "./compose-provider-shell";

const UNSPECIFIED_LOAD: Load = { kind: "unspecified" };
const SEED_REPS = 7;
const NEXT_REPS = 8;

type ExerciseDraft = {
  exercise: { form: "atomic"; exerciseId: string | null };
  reps: { kind: "count"; value: number };
  load: Load;
  side: null;
  tempo: null;
  position: null;
  intensity: null;
  notes: string;
};

const exerciseDraft = (exerciseId: string | null): ExerciseDraft => ({
  exercise: { form: "atomic", exerciseId },
  reps: { kind: "count", value: SEED_REPS },
  load: UNSPECIFIED_LOAD,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: "",
});

const sentinelRow = (editorDraft: ExerciseDraft): ComposeRow => ({
  nodeType: "row",
  id: asNodeId("leaf-under-test"),
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "REST_SLOT" },
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft,
});

const draftRepsValue = (row: ComposeRow): number | null => {
  const draft = row.editorDraft;

  if (typeof draft !== "object" || draft === null || !("reps" in draft)) {
    return null;
  }

  const reps = (draft as { reps?: unknown }).reps;

  return typeof reps === "object" && reps !== null && "value" in reps
    ? ((reps as { value?: unknown }).value as number)
    : null;
};

const LeafHarness = ({ initial }: { initial: ComposeRow }): ReactElement => {
  const [row, setRow] = useState<ComposeRow>(initial);

  const handleUpdateNode = (id: NodeId, patch: (node: ComposeNode) => ComposeNode): void => {
    setRow((current) => {
      const next = updateNode(current, id, patch);

      return next.nodeType === "row" ? next : current;
    });
  };

  return (
    <ComposeProviderShell>
      <div data-testid="row-kind">{row.rowPayload.rowKind}</div>
      <div data-testid="committed">{String(isRowCommitted(row))}</div>
      <div data-testid="draft-reps">{String(draftRepsValue(row))}</div>
      <div data-testid="reps-sibling">{String(row.reps === null ? null : row.reps.kind)}</div>
      <ComposeLeafEditor row={row} onUpdateNode={handleUpdateNode} />
    </ComposeProviderShell>
  );
};

const changeReps = (next: number): void => {
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: String(next) } });
};

describe("ComposeLeafEditor on a partial EXERCISE draft (QA-9, design §A.9 editorDraft↔rowPayload boundary)", () => {
  it("does not corrupt the committed rowPayload when the draft has no exercise picked", () => {
    render(<LeafHarness initial={sentinelRow(exerciseDraft(null))} />);

    changeReps(NEXT_REPS);

    expect(screen.getByTestId("row-kind")).toHaveTextContent("REST_SLOT");
    expect(screen.getByTestId("committed")).toHaveTextContent("false");
  });

  it("still persists the edited editorDraft even when the parse fails", () => {
    render(<LeafHarness initial={sentinelRow(exerciseDraft(null))} />);

    changeReps(NEXT_REPS);

    expect(screen.getByTestId("draft-reps")).toHaveTextContent(String(NEXT_REPS));
  });

  it("does not throw while editing an incomplete leaf", () => {
    render(<LeafHarness initial={sentinelRow(exerciseDraft(null))} />);

    expect(() => changeReps(NEXT_REPS)).not.toThrow();
  });
});

describe("ComposeLeafEditor round-trips a complete EXERCISE draft via the reused converters (QA REVIEW-002, G4)", () => {
  it("recomputes the committed rowPayload to the parsed EXERCISE contract payload", () => {
    render(<LeafHarness initial={sentinelRow(exerciseDraft(MOCK_EXERCISE_IDS.thrusters))} />);

    changeReps(NEXT_REPS);

    expect(screen.getByTestId("row-kind")).toHaveTextContent("EXERCISE");
    expect(screen.getByTestId("committed")).toHaveTextContent("true");
  });

  it("populates the EXERCISE VO siblings from the parsed draft", () => {
    render(<LeafHarness initial={sentinelRow(exerciseDraft(MOCK_EXERCISE_IDS.thrusters))} />);

    changeReps(NEXT_REPS);

    expect(screen.getByTestId("reps-sibling")).toHaveTextContent("count");
    expect(screen.getByTestId("draft-reps")).toHaveTextContent(String(NEXT_REPS));
  });
});
