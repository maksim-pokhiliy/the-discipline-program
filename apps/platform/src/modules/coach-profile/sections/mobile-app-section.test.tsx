import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MobileConnection } from "@repo/contracts/coaching/mobile-connection";

import { makeMobileConnection } from "@app/lib/mobile.fixtures";
import { render } from "@app/test/render";

import type * as CoachProfileComponents from "../components";

type ConnectionsState = {
  data: MobileConnection[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

const connectionsState: ConnectionsState = {
  data: undefined,
  isLoading: false,
  error: null,
};

vi.mock("@app/lib/hooks", () => ({
  useMobileConnections: () => connectionsState,
}));

vi.mock("../components", async (importOriginal) => {
  const actual = await importOriginal<typeof CoachProfileComponents>();

  return {
    ...actual,
    ConnectMobileModal: ({ open }: { open: boolean }) =>
      open ? <div>connect-modal-open</div> : null,
  };
});

const { MobileAppSection } = await import("./mobile-app-section");

const HOURS_12_MS = 12 * 60 * 60 * 1000;
const DAYS_3_MS = 3 * 24 * 60 * 60 * 1000;
const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

beforeEach(() => {
  connectionsState.data = undefined;
  connectionsState.isLoading = false;
  connectionsState.error = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MobileAppSection (MT-11)", () => {
  it("renders the Connect CTA when there is no connection", () => {
    connectionsState.data = [];

    render(<MobileAppSection />);

    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect mobile app" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reconnect" })).toBeNull();
  });

  it("shows no expiry nudge for a far-future expiry", () => {
    connectionsState.data = [
      makeMobileConnection({ expiresAt: new Date(Date.now() + DAYS_30_MS) }),
    ];

    render(<MobileAppSection />);

    expect(screen.getByText("Connected as")).toBeInTheDocument();
    expect(screen.queryByText(/Reconnects in/)).toBeNull();
    expect(screen.queryByText("Expired")).toBeNull();
  });

  it("renders the singular 'Reconnects in 1 day' nudge when one day remains (QA-027)", () => {
    connectionsState.data = [
      makeMobileConnection({ expiresAt: new Date(Date.now() + HOURS_12_MS) }),
    ];

    render(<MobileAppSection />);

    expect(screen.getByText("Reconnects in 1 day")).toBeInTheDocument();
  });

  it("renders the plural nudge for multiple days remaining", () => {
    connectionsState.data = [
      makeMobileConnection({ expiresAt: new Date(Date.now() + DAYS_3_MS - HOURS_12_MS) }),
    ];

    render(<MobileAppSection />);

    expect(screen.getByText("Reconnects in 3 days")).toBeInTheDocument();
  });

  it("renders the Expired nudge and a Reconnect CTA for a past expiry", () => {
    connectionsState.data = [makeMobileConnection({ expiresAt: new Date(Date.now() - DAYS_3_MS) })];

    render(<MobileAppSection />);

    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();
  });

  it("renders an error alert when the connection query fails", () => {
    connectionsState.error = new Error("boom");

    render(<MobileAppSection />);

    expect(screen.getByText("Failed to load the mobile app connection.")).toBeInTheDocument();
  });
});
