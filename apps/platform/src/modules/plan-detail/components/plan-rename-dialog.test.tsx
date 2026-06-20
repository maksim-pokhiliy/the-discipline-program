import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { PlanRenameDialog, type PlanRenameValues } from "./plan-rename-dialog";

const INITIAL_NAME = "Strength Block";
const INITIAL_DESCRIPTION = "Weekly progression";

const onSave: Mock = vi.fn();
const onClose: Mock = vi.fn();

type RenderOverrides = {
  name?: string;
  description?: string | null;
  isSaving?: boolean;
  error?: string | null;
};

const renderDialog = (overrides: RenderOverrides = {}): void => {
  render(
    <PlanRenameDialog
      open
      onClose={onClose}
      name={overrides.name ?? INITIAL_NAME}
      description={
        overrides.description === undefined ? INITIAL_DESCRIPTION : overrides.description
      }
      onSave={onSave}
      isSaving={overrides.isSaving ?? false}
      error={overrides.error ?? null}
    />,
  );
};

const nameField = (): HTMLInputElement => screen.getByLabelText("Plan name") as HTMLInputElement;
const descriptionField = (): HTMLElement => screen.getByLabelText("Description");
const saveButton = (): HTMLElement => screen.getByRole("button", { name: /Sav(e|ing)/ });

const lastSavedValues = (): PlanRenameValues => onSave.mock.calls.at(-1)?.[0] as PlanRenameValues;

afterEach(() => {
  onSave.mockReset();
  onClose.mockReset();
});

describe("PlanRenameDialog", () => {
  describe("name validation (QA-4)", () => {
    it("seeds the fields from the current name and description", () => {
      renderDialog();

      expect(nameField()).toHaveValue(INITIAL_NAME);
      expect(descriptionField()).toHaveValue(INITIAL_DESCRIPTION);
      expect(saveButton()).toBeEnabled();
    });

    it("disables Save and never submits when the name is emptied", () => {
      renderDialog();

      fireEvent.change(nameField(), { target: { value: "" } });

      expect(saveButton()).toBeDisabled();
      expect(nameField()).toBeInvalid();

      fireEvent.click(saveButton());
      expect(onSave).not.toHaveBeenCalled();
    });

    it("rejects a whitespace-only name (QA-4)", () => {
      renderDialog();

      fireEvent.change(nameField(), { target: { value: "   " } });

      expect(saveButton()).toBeDisabled();
      expect(nameField()).toBeInvalid();
    });

    it("does not submit a whitespace-only name even when the form is submitted directly", () => {
      renderDialog();

      fireEvent.change(nameField(), { target: { value: "   " } });
      fireEvent.submit(nameField());

      expect(onSave).not.toHaveBeenCalled();
    });

    it("re-enables Save once a non-blank name is typed back in", () => {
      renderDialog();

      fireEvent.change(nameField(), { target: { value: "   " } });
      expect(saveButton()).toBeDisabled();

      fireEvent.change(nameField(), { target: { value: "Hypertrophy Block" } });
      expect(saveButton()).toBeEnabled();
    });

    it("submits the trimmed name", () => {
      renderDialog();

      fireEvent.change(nameField(), { target: { value: "  Conditioning  " } });
      fireEvent.click(saveButton());

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(lastSavedValues().name).toBe("Conditioning");
    });
  });

  describe("description null semantic (QA-5)", () => {
    it("sends a cleared description as null", () => {
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: "" } });
      fireEvent.click(saveButton());

      expect(lastSavedValues().description).toBeNull();
    });

    it("normalizes a whitespace-only description to null", () => {
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: "   " } });
      fireEvent.click(saveButton());

      expect(lastSavedValues().description).toBeNull();
    });

    it("sends a trimmed non-empty description as a string", () => {
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: "  Deload week  " } });
      fireEvent.click(saveButton());

      expect(lastSavedValues().description).toBe("Deload week");
    });
  });

  describe("save guard (QA-6)", () => {
    it("disables Save while a save is in flight", () => {
      renderDialog({ isSaving: true });

      expect(saveButton()).toBeDisabled();
    });

    it("does not submit a second time while saving, even on a direct form submit", () => {
      renderDialog({ isSaving: true });

      fireEvent.submit(nameField());

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("error surfacing", () => {
    it("renders the error prop as an in-dialog alert", () => {
      renderDialog({ error: "Failed to update training plan" });

      expect(screen.getByRole("alert")).toHaveTextContent("Failed to update training plan");
    });

    it("shows no alert when there is no error", () => {
      renderDialog();

      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
