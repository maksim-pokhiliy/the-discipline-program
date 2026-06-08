import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { render } from "@app/test/render";

import { asNodeId } from "../../lib/axis-draft-id";

import type { ComposeContainer, ComposeNode, NodeId, ScoringDirective } from "./axis-draft.types";
import { ContainerInspector } from "./container-inspector";

const STORED_KIND_LABEL = "AMRAP";
const STORED_HEADER = "Scored group";
const HEADER_ARIA = "Inspector header";
const PROGRAM_GROUP_LABEL = "program";
const STORED_PROGRAM_KIND_LABEL = "wave";
const NONE_LABEL = "none";
const CONDITION_LABEL = "Applies to rounds (optional condition)";

const containerWithScoring = (scoring: ScoringDirective): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("scored-container"),
  header: STORED_HEADER,
  notes: null,
  scoring,
  programKind: "wave",
  children: [],
});

const renderInspector = (
  isCreateMode: boolean,
  onUpdateNode: (id: NodeId, patch: (node: ComposeNode) => ComposeNode) => void = () => undefined,
) =>
  render(
    <ContainerInspector
      container={containerWithScoring({ kind: "amrap" })}
      exerciseById={new Map<string, Exercise>()}
      isCreateMode={isCreateMode}
      onUpdateNode={onUpdateNode}
      onRename={() => undefined}
    />,
  );

const storedKindButton = (): HTMLElement =>
  screen.getByRole("button", { name: STORED_KIND_LABEL, pressed: true });

describe("container inspector scoring axis is editable in edit-mode (R4)", () => {
  it("keeps the stored scoring kind toggle enabled in edit-mode", () => {
    renderInspector(false);

    expect(screen.getByRole("group", { name: "scoring" })).toBeInTheDocument();
    expect(storedKindButton()).toBeInTheDocument();
    expect(storedKindButton()).toBeEnabled();
  });

  it("renders the appliesToRounds condition input for the non-prescribed kind in edit-mode", () => {
    renderInspector(false);

    expect(screen.getByRole("textbox", { name: CONDITION_LABEL })).toBeInTheDocument();
  });

  it("emits an updated scoring condition when the rounds input accepts input in edit-mode", () => {
    const onUpdateNode = vi.fn();

    renderInspector(false, onUpdateNode);
    fireEvent.change(screen.getByRole("textbox", { name: CONDITION_LABEL }), {
      target: { value: "2, 3" },
    });

    expect(onUpdateNode).toHaveBeenCalledTimes(1);

    const patch = onUpdateNode.mock.calls[0]?.[1] as (node: ComposeNode) => ComposeNode;
    const next = patch(containerWithScoring({ kind: "amrap" }));

    expect(next.nodeType === "container" ? next.scoring : undefined).toEqual({
      kind: "amrap",
      condition: { appliesToRounds: [2, 3] },
    });
  });

  it("keeps the scoring kind toggle enabled in create-mode", () => {
    renderInspector(true);

    expect(storedKindButton()).toBeInTheDocument();
    expect(storedKindButton()).toBeEnabled();
  });
});

describe("container inspector header is read-only in edit-mode (QA-102)", () => {
  it("renders the stored header as static, non-editable text in edit-mode", () => {
    renderInspector(false);

    expect(screen.queryByRole("textbox", { name: HEADER_ARIA })).not.toBeInTheDocument();
    expect(screen.getByText(STORED_HEADER)).toBeInTheDocument();
  });

  it("keeps the header an editable input in create-mode", () => {
    renderInspector(true);

    expect(screen.getByRole("textbox", { name: HEADER_ARIA })).toBeInTheDocument();
  });
});

const storedProgramKindButton = (): HTMLElement =>
  screen.getByRole("button", { name: STORED_PROGRAM_KIND_LABEL, pressed: true });

describe("container inspector programKind axis stays editable in edit-mode (QA-006)", () => {
  it("renders the program toggle group enabled in edit-mode alongside editable scoring", () => {
    renderInspector(false);

    expect(screen.getByRole("group", { name: PROGRAM_GROUP_LABEL })).toBeInTheDocument();
    expect(storedKindButton()).toBeEnabled();
    expect(storedProgramKindButton()).toBeEnabled();
  });

  it("keeps the clear affordance enabled in edit-mode", () => {
    renderInspector(false);

    expect(screen.getByRole("button", { name: NONE_LABEL })).toBeEnabled();
  });

  it("keeps the program toggle group enabled in create-mode", () => {
    renderInspector(true);

    expect(storedProgramKindButton()).toBeEnabled();
  });
});
