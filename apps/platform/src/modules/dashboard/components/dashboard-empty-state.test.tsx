import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { DashboardEmptyState } from "./dashboard-empty-state";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardEmptyState", () => {
  it("renders the three-step onboarding checklist", () => {
    render(<DashboardEmptyState coachName="Denys" />);

    expect(screen.getByText("Draft your first plan")).toBeInTheDocument();
    expect(screen.getByText("Open this screen tomorrow")).toBeInTheDocument();
    expect(
      screen.getByText("Send invites by email. They subscribe; they board."),
    ).toBeInTheDocument();
  });

  it("renders the two action links to plans and athletes", () => {
    render(<DashboardEmptyState coachName="Denys" />);

    expect(screen.getByRole("link", { name: /Draft a plan/ })).toHaveAttribute(
      "href",
      "/coach/plans",
    );
    expect(screen.getByRole("link", { name: /Invite athletes/ })).toHaveAttribute(
      "href",
      "/coach/athletes",
    );
  });

  it("greets the coach by name when one is provided", () => {
    render(<DashboardEmptyState coachName="Denys" />);

    expect(screen.getByText(/Welcome, Denys\./)).toBeInTheDocument();
  });

  it("falls back to a generic welcome when no coach name is provided", () => {
    render(<DashboardEmptyState coachName={null} />);

    expect(screen.getByText(/Welcome\./)).toBeInTheDocument();
  });
});
