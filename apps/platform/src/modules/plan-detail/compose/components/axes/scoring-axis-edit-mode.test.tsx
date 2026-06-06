import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { render } from "@app/test/render";

import type { ComposeContainer, ScoringDirective } from "../../compose-tree.types";
import { asNodeId } from "../../lib/id-factory";
import { ComposeContainerInspector } from "../compose-container-inspector";

const STORED_KIND_LABEL = "AMRAP";

const containerWithScoring = (scoring: ScoringDirective): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("scored-container"),
  header: "Scored group",
  notes: null,
  scoring,
  children: [],
});

const renderInspector = (isScoringEditable: boolean) =>
  render(
    <ComposeContainerInspector
      container={containerWithScoring({ kind: "amrap" })}
      exerciseById={new Map<string, Exercise>()}
      isScoringEditable={isScoringEditable}
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
