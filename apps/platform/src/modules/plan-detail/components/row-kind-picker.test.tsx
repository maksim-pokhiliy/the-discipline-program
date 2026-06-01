import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

import { RowKindPicker } from "./row-kind-picker";

const ALL_TILE_LABELS = [
  "Exercise",
  "Rest",
  "Footnote",
  "Standalone load",
  "Standalone URL",
  "Placeholder",
  "Inner ladder",
  "Rep definition",
  "Rest slot (EMOM)",
] as const;

const UN_DEFERRED_TILES = [
  { label: "Footnote", kind: "FOOTNOTE", hotkey: "f" },
  { label: "Placeholder", kind: "PLACEHOLDER", hotkey: "p" },
  { label: "Rep definition", kind: "REP_DEFINITION", hotkey: "d" },
] as const;

const getTileButton = (label: string): HTMLButtonElement => {
  const node = screen.getByText(label).closest("button");

  if (!(node instanceof HTMLButtonElement)) {
    throw new Error(`expected a tile button for "${label}"`);
  }

  return node;
};

const getContinue = (): HTMLElement => screen.getByRole("button", { name: "Continue" });

const renderPicker = (props: { onSelect?: (kind: RowKind) => void; onClose?: () => void } = {}) =>
  render(
    <RowKindPicker
      open={true}
      onClose={props.onClose ?? vi.fn()}
      onSelect={props.onSelect ?? vi.fn()}
    />,
  );

const pressKey = (key: string): void => {
  fireEvent.keyDown(window, { key });
};

describe("RowKindPicker tiles (MT-14)", () => {
  it("renders all 9 row-kind tiles", () => {
    renderPicker();

    for (const label of ALL_TILE_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("RowKindPicker un-deferred tiles (MT-13)", () => {
  it("renders the footnote, placeholder, and rep-definition tiles enabled", () => {
    renderPicker();

    for (const { label } of UN_DEFERRED_TILES) {
      expect(getTileButton(label)).toBeEnabled();
    }
  });

  it("shows no coming-soon hint now that every tile is live", () => {
    renderPicker();

    expect(screen.queryByText("needs exercise editor — coming soon")).toBeNull();
  });

  it.each(UN_DEFERRED_TILES)(
    "selects $kind on click and confirms it via Continue",
    ({ label, kind }) => {
      const onSelect = vi.fn();
      const onClose = vi.fn();

      renderPicker({ onSelect, onClose });

      fireEvent.click(getTileButton(label));
      fireEvent.click(getContinue());

      expect(onSelect).toHaveBeenCalledWith(kind);
      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );

  it.each(UN_DEFERRED_TILES)(
    "emits onSelect($kind) and closes when its tile is double-clicked",
    ({ label, kind }) => {
      const onSelect = vi.fn();
      const onClose = vi.fn();

      renderPicker({ onSelect, onClose });

      fireEvent.doubleClick(getTileButton(label));

      expect(onSelect).toHaveBeenCalledWith(kind);
      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );

  it.each(UN_DEFERRED_TILES)(
    "selects $kind on the $hotkey hotkey and confirms it on Enter",
    ({ kind, hotkey }) => {
      const onSelect = vi.fn();
      const onClose = vi.fn();

      renderPicker({ onSelect, onClose });

      pressKey(hotkey);
      pressKey("Enter");

      expect(onSelect).toHaveBeenCalledWith(kind);
      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );

  it("selects EXERCISE on click and confirms it via Continue now that it is live", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.click(getTileButton("Exercise"));
    fireEvent.click(getContinue());

    expect(onSelect).toHaveBeenCalledWith("EXERCISE");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RowKindPicker Continue gating (MT-13)", () => {
  it("enables Continue at open because REST is the default selection", () => {
    renderPicker();

    expect(getContinue()).toBeEnabled();
  });

  it("emits onSelect(REST) and closes when Continue is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.click(getContinue());

    expect(onSelect).toHaveBeenCalledWith("REST");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RowKindPicker double-click (MT-14)", () => {
  it("emits onSelect for the double-clicked enabled tile and closes", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.doubleClick(getTileButton("Standalone URL"));

    expect(onSelect).toHaveBeenCalledWith("STANDALONE_URL");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RowKindPicker hotkeys (MT-12)", () => {
  it("selects REST on the r hotkey and confirms it on Enter", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    pressKey("r");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledWith("REST");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("selects STANDALONE_URL on the u hotkey and confirms it on Enter", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    pressKey("u");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledWith("STANDALONE_URL");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lets a later footnote hotkey override the prior pick", () => {
    const onSelect = vi.fn();

    renderPicker({ onSelect });

    pressKey("u");
    pressKey("f");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("FOOTNOTE");
  });
});
