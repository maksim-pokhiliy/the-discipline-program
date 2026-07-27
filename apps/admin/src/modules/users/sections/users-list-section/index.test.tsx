import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type AdminUserListItem } from "@repo/contracts/iam/user";

import { setMockSession } from "@app/test/mocks";
import { render } from "@app/test/render";

import { UsersListSection } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const ROW_ID = "clz00000000000000000usr1";

const makeUser = (overrides: Partial<AdminUserListItem> = {}): AdminUserListItem => ({
  id: ROW_ID,
  email: "aria@example.com",
  name: "Aria Stone",
  role: UserRole.COACH,
  image: null,
  timezone: "UTC",
  createdAt: new Date("2026-06-16T09:00:00.000Z"),
  hasPassword: true,
  ...overrides,
});

describe("UsersListSection for an ADMIN viewer", () => {
  it("renders the delete control, the interactive role chip, the edit link and the create action", () => {
    setMockSession(UserRole.ADMIN);

    render(<UsersListSection users={[makeUser()]} />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coach" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View" })).toBeNull();
    expect(screen.getByRole("link", { name: "Create User" })).toBeInTheDocument();
  });

  it("hides the delete control and the role-change interaction on the viewer's own row", () => {
    setMockSession(UserRole.ADMIN, ROW_ID);

    render(<UsersListSection users={[makeUser({ role: UserRole.ADMIN })]} />);

    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("keeps the edit link on the viewer's own row", () => {
    setMockSession(UserRole.ADMIN, ROW_ID);

    render(<UsersListSection users={[makeUser({ role: UserRole.ADMIN })]} />);

    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", `/users/${ROW_ID}`);
    expect(screen.queryByRole("link", { name: "View" })).toBeNull();
  });

  it("keeps the delete control and the role chip on every other row", () => {
    setMockSession(UserRole.ADMIN, ROW_ID);

    render(<UsersListSection users={[makeUser({ id: "clz00000000000000000usr2" })]} />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coach" })).toBeInTheDocument();
  });
});

describe("UsersListSection for a HEAD_COACH viewer", () => {
  it("hides the delete control and the role-change interaction", () => {
    setMockSession(UserRole.HEAD_COACH);

    render(<UsersListSection users={[makeUser()]} />);

    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Coach" })).toBeNull();
    expect(screen.getByText("Coach")).toBeInTheDocument();
  });

  it("labels the row action View instead of Edit and keeps the create action available", () => {
    setMockSession(UserRole.HEAD_COACH);

    render(<UsersListSection users={[makeUser()]} />);

    const detailLink = screen.getByRole("link", { name: "View" });

    expect(detailLink).toHaveAttribute("href", `/users/${ROW_ID}`);
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
    expect(screen.getByRole("link", { name: "Create User" })).toBeInTheDocument();
  });
});
