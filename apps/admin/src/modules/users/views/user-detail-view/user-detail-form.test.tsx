import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";
import { UserRole } from "@repo/contracts/iam/auth";

import { setMockSession } from "@app/test/mocks";
import { render } from "@app/test/render";

import { UserDetailForm } from "./user-detail-form";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const READ_ONLY_NOTICE = "Only an ADMIN can change user records.";

const user: AdminUserView = {
  id: "clz00000000000000000usr1",
  email: "aria@example.com",
  name: "Aria Stone",
  role: UserRole.COACH,
  image: null,
  timezone: "UTC",
  emailVerified: null,
  createdAt: new Date("2026-06-16T09:00:00.000Z"),
  updatedAt: new Date("2026-06-16T09:00:00.000Z"),
  hasPassword: false,
  athleteProfile: null,
  coachProfile: null,
};

describe("UserDetailForm for an ADMIN viewer", () => {
  it("renders the submit action and no read-only notice", () => {
    setMockSession(UserRole.ADMIN);

    render(<UserDetailForm user={user} />);

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    expect(screen.queryByText(READ_ONLY_NOTICE)).toBeNull();
  });

  it("leaves the record editable", () => {
    setMockSession(UserRole.ADMIN);

    render(<UserDetailForm user={user} />);

    const name = screen.getByLabelText("Name");

    expect(name).not.toHaveAttribute("readonly");
    expect(name).not.toBeDisabled();
  });
});

describe("UserDetailForm for a HEAD_COACH viewer", () => {
  it("hides the submit action and explains why", () => {
    setMockSession(UserRole.HEAD_COACH);

    render(<UserDetailForm user={user} />);

    expect(screen.queryByRole("button", { name: "Save Changes" })).toBeNull();
    expect(screen.getByText(READ_ONLY_NOTICE)).toBeInTheDocument();
  });

  it("renders the record read-only rather than disabled, so it stays readable", () => {
    setMockSession(UserRole.HEAD_COACH);

    render(<UserDetailForm user={user} />);

    const name = screen.getByLabelText("Name");

    expect(name).toHaveAttribute("readonly");
    expect(name).not.toBeDisabled();
    expect(name).toHaveValue("Aria Stone");
  });

  it("keeps Resend invite available", () => {
    setMockSession(UserRole.HEAD_COACH);

    render(<UserDetailForm user={user} />);

    expect(screen.getByRole("button", { name: "Resend invite" })).toBeInTheDocument();
  });
});
