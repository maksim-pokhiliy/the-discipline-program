import { useState, type ReactElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateModifierData, Modifier } from "@repo/contracts/lms/modifier";

import { render } from "@app/test/render";

const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeModifier = (overrides: Partial<Modifier> & Pick<Modifier, "id" | "name">): Modifier => ({
  nameLower: overrides.name.toLowerCase(),
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const FROM_SOFA = makeModifier({ id: "clp9z8x7w0000abcd12mod0001", name: "from sofa" });
const BANDED = makeModifier({ id: "clp9z8x7w0000abcd12mod0002", name: "banded" });

const searchState: { data: Modifier[] } = { data: [] };
const createModifierMock = vi.fn<(data: CreateModifierData) => Promise<Modifier>>();

vi.mock("@app/lib/hooks/use-debounced-value", () => ({
  useDebouncedValue: <TValue,>(value: TValue): TValue => value,
}));

vi.mock("@app/lib/hooks/use-modifier-search", () => ({
  useModifierSearch: () => ({ data: searchState.data, isFetching: false }),
}));

vi.mock("@app/lib/hooks/use-create-modifier", () => ({
  useCreateModifier: () => ({ mutateAsync: createModifierMock }),
}));

const { ModifierPicker } = await import("./modifier-picker");

const openListbox = (): void => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

const typeQuery = (text: string): void => {
  fireEvent.change(screen.getByRole("combobox"), { target: { value: text } });
};

const chipLabels = (): string[] =>
  screen.getAllByRole("button").flatMap((node) => {
    const label = node.querySelector(".MuiChip-label");

    return label?.textContent ? [label.textContent] : [];
  });

const ControlledPicker = (): ReactElement => {
  const [value, setValue] = useState<string[]>([]);

  return <ModifierPicker value={value} onChange={setValue} />;
};

beforeEach(() => {
  searchState.data = [];
  createModifierMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ModifierPicker chips", () => {
  it("renders the attached value ids as named chips from resolvedRefs", () => {
    render(
      <ModifierPicker
        value={[FROM_SOFA.id, BANDED.id]}
        onChange={vi.fn()}
        resolvedRefs={[FROM_SOFA, BANDED]}
      />,
    );

    expect(chipLabels()).toEqual(["from sofa", "banded"]);
  });

  it("renders the raw id as the chip label when no name is resolvable", () => {
    render(<ModifierPicker value={[FROM_SOFA.id]} onChange={vi.fn()} />);

    expect(chipLabels()).toEqual([FROM_SOFA.id]);
  });
});

describe("ModifierPicker search options", () => {
  it("surfaces a Create option for a query with no exact match (filterOptions)", () => {
    searchState.data = [BANDED];

    render(<ModifierPicker value={[]} onChange={vi.fn()} />);

    openListbox();
    typeQuery("from sofa");

    expect(screen.getByText('Create "from sofa"')).toBeInTheDocument();
  });

  it("suppresses the Create option when the query exactly matches a search result", () => {
    searchState.data = [FROM_SOFA];

    render(<ModifierPicker value={[]} onChange={vi.fn()} />);

    openListbox();
    typeQuery("from sofa");

    expect(screen.queryByText('Create "from sofa"')).not.toBeInTheDocument();
  });

  it("still offers Create for an existing name absent from the current results (QA-007)", () => {
    searchState.data = [];

    render(<ModifierPicker value={[]} onChange={vi.fn()} />);

    openListbox();
    typeQuery("from sofa");

    expect(screen.getByText('Create "from sofa"')).toBeInTheDocument();
  });
});

describe("ModifierPicker create-on-the-fly", () => {
  it("mints a new modifier and appends its id when the Create option is chosen", async () => {
    const onChange = vi.fn();
    const minted = makeModifier({ id: "clp9z8x7w0000abcd12mod0009", name: "from sofa" });

    createModifierMock.mockResolvedValueOnce(minted);
    searchState.data = [];

    render(<ModifierPicker value={[BANDED.id]} onChange={onChange} resolvedRefs={[BANDED]} />);

    openListbox();
    typeQuery("from sofa");
    fireEvent.click(screen.getByText('Create "from sofa"'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(createModifierMock).toHaveBeenCalledWith({ name: "from sofa", notes: null });
    expect(onChange).toHaveBeenCalledWith([BANDED.id, minted.id]);
  });

  it("resolves a freshly minted modifier's name on its chip, not the raw id", async () => {
    const minted = makeModifier({ id: "clp9z8x7w0000abcd12mod0011", name: "from sofa" });

    createModifierMock.mockResolvedValueOnce(minted);
    searchState.data = [];

    render(<ControlledPicker />);

    openListbox();
    typeQuery("from sofa");
    fireEvent.click(screen.getByText('Create "from sofa"'));

    await vi.waitFor(() => expect(chipLabels()).toEqual(["from sofa"]));
  });

  it("appends a freeSolo-committed name through the same mint path", async () => {
    const onChange = vi.fn();
    const minted = makeModifier({ id: "clp9z8x7w0000abcd12mod0010", name: "tempo grind" });

    createModifierMock.mockResolvedValueOnce(minted);
    searchState.data = [];

    render(<ModifierPicker value={[]} onChange={onChange} />);

    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "tempo grind" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(createModifierMock).toHaveBeenCalledWith({ name: "tempo grind", notes: null });
    expect(onChange).toHaveBeenCalledWith([minted.id]);
  });

  it("dedupes a minted id that collides with an already-attached id", async () => {
    const onChange = vi.fn();

    createModifierMock.mockResolvedValueOnce(FROM_SOFA);
    searchState.data = [];

    render(
      <ModifierPicker value={[FROM_SOFA.id]} onChange={onChange} resolvedRefs={[FROM_SOFA]} />,
    );

    openListbox();
    typeQuery("from sofa");
    fireEvent.click(screen.getByText('Create "from sofa"'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(onChange).toHaveBeenCalledWith([FROM_SOFA.id]);
  });

  it("keeps the existing selection and skips the failed mint (QA-008)", async () => {
    const onChange = vi.fn();

    createModifierMock.mockRejectedValueOnce(new Error("conflict"));
    searchState.data = [];

    render(<ModifierPicker value={[BANDED.id]} onChange={onChange} resolvedRefs={[BANDED]} />);

    openListbox();
    typeQuery("from sofa");
    fireEvent.click(screen.getByText('Create "from sofa"'));

    await vi.waitFor(() => expect(createModifierMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith([BANDED.id]));
  });
});

describe("ModifierPicker cap", () => {
  it("makes the input read-only and shows the cap helper at the modifier limit", () => {
    const ids = Array.from(
      { length: 20 },
      (_, index) => `clp9z8x7w0000abcd12mod${String(index).padStart(4, "0")}`,
    );

    render(<ModifierPicker value={ids} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveAttribute("readonly");
    expect(screen.getByText("Up to 20 items")).toBeInTheDocument();
  });
});
