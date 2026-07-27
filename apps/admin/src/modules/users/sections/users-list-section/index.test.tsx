import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type AdminUserListItem } from "@repo/contracts/iam/user";

import { render } from "@app/test/render";

const sessionState: { role: UserRole } = { role: UserRole.ADMIN };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/users",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@repo/auth/client", () => ({
  useSession: () => ({ data: { user: { role: sessionState.role } } }),
}));

const { UsersListSection } = await import("./index");

const makeUser = (overrides: Partial<AdminUserListItem> = {}): AdminUserListItem => ({
  id: "clz00000000000000000usr1",
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
    sessionState.role = UserRole.ADMIN;

    render(<UsersListSection users={[makeUser()]} />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coach" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create User" })).toBeInTheDocument();
  });
});

describe("UsersListSection for a HEAD_COACH viewer", () => {
  it("hides the delete control and the role-change interaction", () => {
    sessionState.role = UserRole.HEAD_COACH;

    render(<UsersListSection users={[makeUser()]} />);

    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Coach" })).toBeNull();
    expect(screen.getByText("Coach")).toBeInTheDocument();
  });

  it("keeps the edit link and the create action available", () => {
    sessionState.role = UserRole.HEAD_COACH;

    render(<UsersListSection users={[makeUser()]} />);

    expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create User" })).toBeInTheDocument();
  });
});
