import { screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLocaleRequestSchema } from "@repo/contracts/cms/locale";
import { ConflictError, ValidationError } from "@repo/errors";

import { api } from "@app/lib/api";
import { clickButton, typeInto } from "@app/test/interactions";
import { render } from "@app/test/render";

import { UKRAINIAN } from "../../languages.fixtures";

import { LanguagesCreateView } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const fill = (code = UKRAINIAN.code): void => {
  typeInto("Code", code);
  typeInto("Name", UKRAINIAN.name);
};

beforeEach(() => {
  vi.spyOn(api.locales, "create").mockResolvedValue(UKRAINIAN);
  vi.spyOn(toast, "success").mockImplementation(() => "toast");
  vi.spyOn(toast, "error").mockImplementation(() => "toast");
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("LanguagesCreateView", () => {
  it("explains the code and the hidden initial state", () => {
    render(<LanguagesCreateView />);

    expect(
      screen.getByText(
        "Two or three lowercase letters that start the language's links, as in /uk. It cannot be changed later.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A new language starts hidden from the site. Translate it, then enable it from the list.",
      ),
    ).toBeInTheDocument();
  });

  it.each([
    { code: "faq", message: 'The locale code "faq" is reserved by a path of the site' },
    { code: "UK", message: "Use two or three lowercase letters" },
  ])("refuses $code on its field before any request", async ({ code, message }) => {
    render(<LanguagesCreateView />);
    fill(code);
    clickButton("Create");

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toHaveAttribute("aria-invalid", "true");
    expect(api.locales.create).not.toHaveBeenCalled();
  });

  it("shows a duplicate response on the code field without a toast", async () => {
    vi.mocked(api.locales.create).mockRejectedValueOnce(
      new ConflictError("Server duplicate wording", { field: "code", code: "uk" }),
    );
    render(<LanguagesCreateView />);
    fill();
    clickButton("Create");

    expect(await screen.findByText("A language with this code already exists")).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toHaveAttribute("aria-invalid", "true");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows a server validation response on the code field", async () => {
    vi.mocked(api.locales.create).mockRejectedValueOnce(
      new ValidationError("Validation failed", {
        issues: [{ path: "code", message: "Code is reserved by the server" }],
      }),
    );
    render(<LanguagesCreateView />);
    fill();
    clickButton("Create");

    expect(await screen.findByText("Code is reserved by the server")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("notifies an unmapped failure without putting it on the code field", async () => {
    vi.mocked(api.locales.create).mockRejectedValueOnce(new Error("Service unavailable"));
    render(<LanguagesCreateView />);
    fill();
    clickButton("Create");

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Service unavailable"));
    expect(screen.getByLabelText("Code")).toHaveAttribute("aria-invalid", "false");
  });

  it("submits only the code and trimmed name accepted by the request schema and toasts", async () => {
    render(<LanguagesCreateView />);
    fill();
    typeInto("Name", ` ${UKRAINIAN.name} `);
    clickButton("Create");

    await waitFor(() => expect(api.locales.create).toHaveBeenCalledTimes(1));

    const payload = createLocaleRequestSchema.parse(
      vi.mocked(api.locales.create).mock.calls[0]?.[0],
    );

    expect(payload).toEqual({ code: UKRAINIAN.code, name: UKRAINIAN.name });
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Language created successfully"),
    );
  });
});
