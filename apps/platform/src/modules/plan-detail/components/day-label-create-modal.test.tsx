import { type ReactElement } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Label } from "@repo/contracts/lms/label";
import { usePromiseModal } from "@repo/ui";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const createLabelState = { isPending: false };
const createLabelMock: Mock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateLabel: () => ({
      mutate: createLabelMock,
      isPending: createLabelState.isPending,
    }),
  };
});

const { DayLabelCreateModal } = await import("./day-label-create-modal");

const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeLabel = (overrides: Partial<Label> & Pick<Label, "id" | "name">): Label => ({
  nameLower: overrides.name.toLowerCase(),
  applicableLevels: ["DAY"],
  notes: null,
  rest: false,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const onResolve: Mock = vi.fn();

const OPEN_LABEL = "open day label modal";

const Harness = ({ initialName }: { initialName: string }): ReactElement => {
  const controller = usePromiseModal<{ initialName: string }, { id: string; label: string }>();

  const handleOpen = (): void => {
    void controller.open({ initialName }).then((result) => {
      if (result !== null) {
        onResolve(result);
      }
    });
  };

  return (
    <>
      <button type="button" onClick={handleOpen}>
        {OPEN_LABEL}
      </button>
      <DayLabelCreateModal controller={controller} />
    </>
  );
};

const openModal = (initialName: string): HTMLElement => {
  render(<Harness initialName={initialName} />);

  fireEvent.click(screen.getByRole("button", { name: OPEN_LABEL }));

  return screen.getByRole("dialog");
};

const submit = (dialog: HTMLElement): void => {
  fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
};

afterEach(() => {
  createLabelState.isPending = false;
  createLabelMock.mockReset();
  onResolve.mockReset();
});

describe("DayLabelCreateModal", () => {
  it("seeds the name field from the typed query and defaults the rest toggle off", () => {
    const dialog = openModal("Long Run");

    expect(within(dialog).getByRole("heading", { name: "Create day label" })).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Long Run")).toBeInTheDocument();
    expect(within(dialog).getByRole("switch", { name: "Rest day" })).not.toBeChecked();
  });

  it("mints a non-rest DAY label by default", async () => {
    submit(openModal("Long Run"));

    await vi.waitFor(() => expect(createLabelMock).toHaveBeenCalledTimes(1));
    expect(createLabelMock.mock.calls[0]?.[0]).toEqual({
      name: "Long Run",
      applicableLevels: ["DAY"],
      notes: null,
      rest: false,
    });
  });

  it("mints a rest DAY label when the Rest day toggle is on", async () => {
    const dialog = openModal("Rest");

    fireEvent.click(within(dialog).getByRole("switch", { name: "Rest day" }));
    submit(dialog);

    await vi.waitFor(() => expect(createLabelMock).toHaveBeenCalledTimes(1));
    expect(createLabelMock.mock.calls[0]?.[0]).toEqual({
      name: "Rest",
      applicableLevels: ["DAY"],
      notes: null,
      rest: true,
    });
  });

  it("resolves the controller with the minted option and closes on success", async () => {
    const minted = makeLabel({ id: "lab-1", name: "Rest", rest: true });

    createLabelMock.mockImplementation((_data, options: { onSuccess: (label: Label) => void }) => {
      options.onSuccess(minted);
    });

    submit(openModal("Rest"));

    await vi.waitFor(() => expect(onResolve).toHaveBeenCalledWith({ id: "lab-1", label: "Rest" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancels without minting when the Close button is clicked", async () => {
    const dialog = openModal("Rest");

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(createLabelMock).not.toHaveBeenCalled();
    expect(onResolve).not.toHaveBeenCalled();
  });
});
