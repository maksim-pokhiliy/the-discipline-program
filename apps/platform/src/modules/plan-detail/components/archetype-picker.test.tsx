import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Archetype } from "@repo/contracts/lms/archetype";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { SelectedArchetype } from "./schema-editor-types";

const archetypesState: { data: Archetype[] | undefined; isLoading: boolean; isError: boolean } = {
  data: [],
  isLoading: false,
  isError: false,
};

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useArchetypes: () => ({
      data: archetypesState.data,
      isLoading: archetypesState.isLoading,
      isError: archetypesState.isError,
    }),
  };
});

const { ArchetypePicker } = await import("./archetype-picker");

const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeArchetype = (overrides: Partial<Archetype>): Archetype => ({
  id: "clp9z8x7w0000abcd1234arc1",
  name: "n-rounds",
  label: "N Rounds",
  kind: "ATOMIC",
  family: "ROUNDS_SETS",
  headerPatternDescription: "rounds of work",
  bodyLayoutDescription: "",
  archetypeParamsSchema: {},
  relatedArchetypes: {},
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const N_ROUNDS = makeArchetype({
  id: "clp9z8x7w0000abcd1234a01",
  name: "n-rounds",
  label: "N Rounds",
});
const AMRAP = makeArchetype({
  id: "clp9z8x7w0000abcd1234a02",
  name: "amrap-flat",
  label: "AMRAP Flat",
  family: "TIME_CAP",
  headerPatternDescription: "as many rounds as possible",
});
const LADDER = makeArchetype({
  id: "clp9z8x7w0000abcd1234a03",
  name: "ladder-descending",
  label: "Ladder Descending",
  family: "LADDER",
});
const SUPER_SET = makeArchetype({
  id: "clp9z8x7w0000abcd1234a04",
  name: "super-set",
  label: "Super Set",
  family: "ROUNDS_SETS",
});

const FIXTURE: Archetype[] = [N_ROUNDS, AMRAP, LADDER, SUPER_SET];

const getTileButton = (label: string): HTMLButtonElement => {
  const node = screen.getByText(label).closest("button");

  if (!(node instanceof HTMLButtonElement)) {
    throw new Error(`expected a tile button for "${label}"`);
  }

  return node;
};

const renderPicker = (props: {
  onSelect?: (selected: SelectedArchetype) => void;
  onClose?: () => void;
}) =>
  render(
    <ArchetypePicker
      open={true}
      onClose={props.onClose ?? vi.fn()}
      onSelect={props.onSelect ?? vi.fn()}
    />,
  );

const getSearchInput = (): HTMLElement => screen.getByPlaceholderText("Search archetypes…");

const getContinue = (): HTMLElement => screen.getByRole("button", { name: "Continue" });

beforeEach(() => {
  archetypesState.data = FIXTURE;
  archetypesState.isLoading = false;
  archetypesState.isError = false;
});

describe("ArchetypePicker search", () => {
  it("filters the tiles to those matching the query", () => {
    renderPicker({});

    fireEvent.change(getSearchInput(), { target: { value: "amrap" } });

    expect(screen.getByText("AMRAP Flat")).toBeInTheDocument();
    expect(screen.queryByText("Ladder Descending")).toBeNull();
    expect(screen.queryByText("N Rounds")).toBeNull();
  });

  it("shows the empty-filter message when nothing matches", () => {
    renderPicker({});

    fireEvent.change(getSearchInput(), { target: { value: "zzz" } });

    expect(screen.getByText('No archetypes match "zzz"')).toBeInTheDocument();
  });
});

describe("ArchetypePicker family grouping", () => {
  it("renders family group headers in ARCHETYPE_FAMILIES order", () => {
    renderPicker({});

    const headers = screen
      .getAllByText(/—\s\d+$/)
      .map((el) => el.textContent ?? "")
      .filter((text) => text.includes("&") || text.includes("Ladders") || text.includes("Time"));

    const roundsIndex = headers.findIndex((text) => text.startsWith("Rounds & sets"));
    const ladderIndex = headers.findIndex((text) => text.startsWith("Ladders"));
    const timeCapIndex = headers.findIndex((text) => text.startsWith("Time-capped"));

    expect(roundsIndex).toBeGreaterThanOrEqual(0);
    expect(roundsIndex).toBeLessThan(ladderIndex);
    expect(ladderIndex).toBeLessThan(timeCapIndex);
  });

  it("labels each group with its member count", () => {
    renderPicker({});

    expect(screen.getByText("Rounds & sets — 2")).toBeInTheDocument();
    expect(screen.getByText("Ladders — 1")).toBeInTheDocument();
  });
});

describe("ArchetypePicker deferred archetypes", () => {
  it("disables the deferred super-set tile and renders its hint", () => {
    renderPicker({});

    expect(getTileButton("Super Set")).toBeDisabled();
    expect(screen.getByText("needs body-row wiring — coming soon")).toBeInTheDocument();
  });

  it("does not select a deferred tile on click (Continue stays disabled)", () => {
    renderPicker({});

    fireEvent.click(getTileButton("Super Set"));

    expect(getContinue()).toBeDisabled();
  });
});

describe("ArchetypePicker selection and confirm", () => {
  it("keeps Continue disabled until a tile is selected", () => {
    renderPicker({});

    expect(getContinue()).toBeDisabled();

    fireEvent.click(getTileButton("N Rounds"));

    expect(getContinue()).toBeEnabled();
  });

  it("emits onSelect with the SelectedArchetype and closes on Continue", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.click(getTileButton("N Rounds"));
    fireEvent.click(getContinue());

    expect(onSelect).toHaveBeenCalledWith({
      archetypeId: N_ROUNDS.id,
      name: "n-rounds",
      kind: "ATOMIC",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("emits onSelect and closes on double-click", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.doubleClick(getTileButton("Ladder Descending"));

    expect(onSelect).toHaveBeenCalledWith({
      archetypeId: LADDER.id,
      name: "ladder-descending",
      kind: "ATOMIC",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ArchetypePicker stale selection (QA-24 regression)", () => {
  it("disables Continue when the selected tile is filtered out by search", () => {
    renderPicker({});

    fireEvent.click(getTileButton("N Rounds"));
    expect(getContinue()).toBeEnabled();

    fireEvent.change(getSearchInput(), { target: { value: "zzz" } });

    expect(getContinue()).toBeDisabled();
  });
});
