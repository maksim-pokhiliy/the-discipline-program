import { type ReactElement } from "react";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { FormView } from "./form-view";

type HarnessValues = {
  name: string;
};

type HarnessProps = {
  onSubmit: (data: HarnessValues) => void;
  isSubmitHidden?: boolean | undefined;
};

const Harness = ({ onSubmit, isSubmitHidden = false }: HarnessProps): ReactElement => {
  const methods = useForm<HarnessValues>({ defaultValues: { name: "Aria Stone" } });

  return (
    <FormView
      methods={methods}
      onSubmit={onSubmit}
      isPending={false}
      title="User Details"
      subtitle="aria@example.com"
      backHref="/users"
      backLabel="Back to Users"
      isSubmitHidden={isSubmitHidden}
    >
      <input aria-label="Name" {...methods.register("name")} />
    </FormView>
  );
};

const getForm = (container: HTMLElement): HTMLFormElement => {
  const form = container.querySelector("form");

  if (!form) {
    throw new Error("FormView did not render a form element");
  }

  return form;
};

const flushPendingSubmit = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

describe("FormView", () => {
  describe("by default", () => {
    it("renders the submit action", () => {
      render(<Harness onSubmit={vi.fn()} />);

      expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });

    it("calls onSubmit when the form is submitted", async () => {
      const onSubmit = vi.fn();
      const { container } = render(<Harness onSubmit={onSubmit} />);

      fireEvent.submit(getForm(container));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it("calls onSubmit when the submit action is clicked", async () => {
      const onSubmit = vi.fn();

      render(<Harness onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("when isSubmitHidden", () => {
    it("renders no submit control", () => {
      const { container } = render(<Harness onSubmit={vi.fn()} isSubmitHidden />);

      expect(screen.queryByRole("button", { name: "Save Changes" })).toBeNull();
      expect(container.querySelector('button[type="submit"]')).toBeNull();
    });

    it("does not call onSubmit when the form is submitted", async () => {
      const onSubmit = vi.fn();
      const { container } = render(<Harness onSubmit={onSubmit} isSubmitHidden />);

      fireEvent.submit(getForm(container));
      await flushPendingSubmit();

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("still renders the children and the back link", () => {
      render(<Harness onSubmit={vi.fn()} isSubmitHidden />);

      expect(screen.getByLabelText("Name")).toHaveValue("Aria Stone");
      expect(screen.getByRole("link", { name: "Back to Users" })).toHaveAttribute("href", "/users");
    });
  });
});
