import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { platformKeys } from "@app/lib/api/keys";
import { DatePickerStub } from "@app/test/date-picker-stub";
import { render } from "@app/test/render";

import { type OneRmMovementOption } from "./update-one-rm-form";

const BACK_SQUAT: OneRmMovementOption = {
  exerciseId: "ckxw5p7gp0000q1mnzv5cuq01",
  exerciseName: "Back Squat",
};

const DEADLIFT: OneRmMovementOption = {
  exerciseId: "ckxw5p7gp0000q1mnzv5cuq02",
  exerciseName: "Deadlift",
};

const MOVEMENTS: OneRmMovementOption[] = [BACK_SQUAT];
const TWO_MOVEMENTS: OneRmMovementOption[] = [BACK_SQUAT, DEADLIFT];

const createOneRmState = { isPending: false };
const createOneRmMock: Mock = vi.fn();

vi.mock("@app/lib/hooks/use-one-rm-records", () => ({
  useCreateOneRMRecord: () => ({
    mutate: createOneRmMock,
    isPending: createOneRmState.isPending,
  }),
}));

vi.mock("@mui/x-date-pickers/DatePicker", () => ({ DatePicker: DatePickerStub }));

const { UpdateOneRmModal } = await import("./update-one-rm-modal");

const saveButton = (): HTMLElement => screen.getByRole("button", { name: "Save Record" });
const valueField = (): HTMLElement => screen.getByLabelText("Value (kg)");
const movementField = (): HTMLElement => screen.getByRole("combobox");
const clearButton = (): HTMLElement => screen.getByLabelText("Clear");

const selectBackSquat = (): void => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(screen.getByText("Back Squat"));
};

afterEach(() => {
  createOneRmState.isPending = false;
  createOneRmMock.mockReset();
});

describe("UpdateOneRmModal", () => {
  it("disables Save until both a movement and a positive value are present", () => {
    render(<UpdateOneRmModal open onClose={vi.fn()} movements={MOVEMENTS} />);

    expect(saveButton()).toBeDisabled();

    selectBackSquat();
    expect(saveButton()).toBeDisabled();

    fireEvent.change(valueField(), { target: { value: "120" } });
    expect(saveButton()).toBeEnabled();
  });

  it("keeps Save disabled for a non-positive value", () => {
    render(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.change(valueField(), { target: { value: "0" } });

    expect(saveButton()).toBeDisabled();
  });

  it("submits the mutation with the picked movement and parsed value", () => {
    render(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.change(valueField(), { target: { value: "120" } });
    fireEvent.click(saveButton());

    expect(createOneRmMock).toHaveBeenCalledTimes(1);
    expect(createOneRmMock.mock.calls[0]?.[0]).toMatchObject({
      exerciseId: BACK_SQUAT.exerciseId,
      valueKg: 120,
    });
  });

  it("invalidates both the records view and the shared 1RM list on a successful save", () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries");

    createOneRmMock.mockImplementation(
      (_data: unknown, options?: { onSuccess?: () => void }): void => {
        const sharedHookClient = new QueryClient();

        void sharedHookClient.invalidateQueries({ queryKey: platformKeys.oneRMRecords.list() });
        options?.onSuccess?.();
      },
    );

    render(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.change(valueField(), { target: { value: "120" } });
    fireEvent.click(saveButton());

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) =>
      JSON.stringify((call[0] as { queryKey: unknown }).queryKey),
    );

    expect(invalidatedKeys).toContain(JSON.stringify(platformKeys.oneRMRecords.list()));
    expect(invalidatedKeys).toContain(JSON.stringify(platformKeys.athleteRecords.data()));

    invalidateSpy.mockRestore();
  });

  it("closes after a successful save", () => {
    const onClose = vi.fn();

    createOneRmMock.mockImplementation(
      (_data: unknown, options?: { onSuccess?: () => void }): void => {
        options?.onSuccess?.();
      },
    );

    render(
      <UpdateOneRmModal
        open
        onClose={onClose}
        movements={MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.change(valueField(), { target: { value: "120" } });
    fireEvent.click(saveButton());

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables Save while the mutation is pending to guard against double-submit", () => {
    createOneRmState.isPending = true;

    render(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.change(valueField(), { target: { value: "120" } });

    expect(saveButton()).toBeDisabled();

    fireEvent.click(saveButton());

    expect(createOneRmMock).not.toHaveBeenCalled();
  });
});

describe("UpdateOneRmModal movement choice", () => {
  it("leaves the movement empty when the athlete clears the preset", () => {
    render(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={TWO_MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.change(valueField(), { target: { value: "120" } });

    expect(saveButton()).toBeEnabled();

    fireEvent.click(clearButton());

    expect(movementField()).toHaveValue("");
    expect(saveButton()).toBeDisabled();
  });

  it("submits the movement the athlete switched to, not the preset", () => {
    render(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={TWO_MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.mouseDown(movementField());
    fireEvent.click(screen.getByText(DEADLIFT.exerciseName));
    fireEvent.change(valueField(), { target: { value: "180" } });
    fireEvent.click(saveButton());

    expect(createOneRmMock).toHaveBeenCalledTimes(1);
    expect(createOneRmMock.mock.calls[0]?.[0]).toMatchObject({
      exerciseId: DEADLIFT.exerciseId,
      valueKg: 180,
    });
  });

  it("applies the preset when the catalog arrives after the first render", () => {
    const { rerender } = render(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={[]}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    fireEvent.change(valueField(), { target: { value: "120" } });

    expect(saveButton()).toBeDisabled();

    rerender(
      <UpdateOneRmModal
        open
        onClose={vi.fn()}
        movements={MOVEMENTS}
        presetExerciseId={BACK_SQUAT.exerciseId}
      />,
    );

    expect(saveButton()).toBeEnabled();

    fireEvent.click(saveButton());

    expect(createOneRmMock.mock.calls[0]?.[0]).toMatchObject({
      exerciseId: BACK_SQUAT.exerciseId,
      valueKg: 120,
    });
  });
});
