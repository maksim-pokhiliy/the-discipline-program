import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { render } from "@app/test/render";

import type { ComposeContainer, ScoringDirective } from "../../compose-tree.types";
import { asNodeId } from "../../lib/id-factory";
import { ComposeContainerInspector } from "../compose-container-inspector";

const STORED_KIND_LABEL = "AMRAP";
const STORED_HEADER = "Scored group";
const HEADER_ARIA = "Inspector header";

const containerWithScoring = (scoring: ScoringDirective): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("scored-container"),
  header: STORED_HEADER,
  notes: null,
  scoring,
  children: [],
});

const renderInspector = (isCreateMode: boolean) =>
  render(
    <ComposeContainerInspector
      container={containerWithScoring({ kind: "amrap" })}
      exerciseById={new Map<string, Exercise>()}
      isCreateMode={isCreateMode}
      onUpdateNode={() => undefined}
      onRename={() => undefined}
    />,
  );

const storedKindButton = (): HTMLElement =>
  screen.getByRole("button", { name: STORED_KIND_LABEL, pressed: true });

describe("compose container inspector scoring axis is read-only in edit-mode (D-SCORING-RENDER)", () => {
  it("renders the stored scoring kind disabled but visible when scoring is non-editable", () => {
    renderInspector(false);

    expect(screen.getByRole("group", { name: "scoring" })).toBeInTheDocument();
    expect(storedKindButton()).toBeInTheDocument();
    expect(storedKindButton()).toBeDisabled();
  });

  it("keeps the scoring kind editable when scoring is editable", () => {
    renderInspector(true);

    expect(storedKindButton()).toBeInTheDocument();
    expect(storedKindButton()).toBeEnabled();
  });
});

describe("compose container inspector header is read-only in edit-mode (QA-102)", () => {
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
