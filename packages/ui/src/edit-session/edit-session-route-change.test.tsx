import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import {
  buildOrchestratorWrapper,
  OrchestratorProbe,
  TestCard,
  type TestDraft,
} from "./test-utils";
import { type EditSessionContextValue, type RouteChangeFlushResult } from "./types";

describe("EditSessionProvider — route-change modal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requestRouteChangeFlush opens a modal when at least one draft is dirty", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);
    const fnA = vi.fn(async (draft: TestDraft, version: number) => ({
      ...draft,
      version: version + 1,
    }));

    render(
      <Wrapper>
        <TestCard
          sessionId="dirty-1"
          initial={{ value: "alpha" }}
          mutationFn={fnA}
          dispatchValue="alpha-2"
          shouldDispatch
          label="Card A"
        />
        <OrchestratorProbe
          onReady={(orchestrator) => {
            captured = orchestrator;
          }}
        />
      </Wrapper>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const orchestrator = captured as unknown as EditSessionContextValue;
    let pending: Promise<RouteChangeFlushResult> | null = null;

    await act(async () => {
      pending = orchestrator.requestRouteChangeFlush();
    });

    await waitFor(() => {
      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    });
    expect(screen.getByText("Card A")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save all/i }));
      await Promise.resolve();
    });

    let outcome: RouteChangeFlushResult = "cancel";

    await act(async () => {
      outcome = await (pending as unknown as Promise<RouteChangeFlushResult>);
    });

    expect(outcome).toBe("proceed");
    expect(fnA).toHaveBeenCalledTimes(1);
  });

  it("a second concurrent requestRouteChangeFlush returns 'cancel' immediately", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const onConcurrent = vi.fn();
    const Wrapper = buildOrchestratorWrapper(queryClient, {
      onConcurrentRouteChangeFlush: onConcurrent,
    });

    render(
      <Wrapper>
        <TestCard
          sessionId="d"
          initial={{ value: "alpha" }}
          mutationFn={vi.fn(async (draft: TestDraft, version: number) => ({
            ...draft,
            version: version + 1,
          }))}
          dispatchValue="alpha-2"
          shouldDispatch
        />
        <OrchestratorProbe
          onReady={(orchestrator) => {
            captured = orchestrator;
          }}
        />
      </Wrapper>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const orchestrator = captured as unknown as EditSessionContextValue;
    let firstPromise: Promise<RouteChangeFlushResult> | null = null;
    let secondOutcome: RouteChangeFlushResult = "proceed";

    await act(async () => {
      firstPromise = orchestrator.requestRouteChangeFlush();
      await Promise.resolve();
      secondOutcome = await orchestrator.requestRouteChangeFlush();
    });

    expect(secondOutcome).toBe("cancel");
    expect(onConcurrent).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    });
    await act(async () => {
      await (firstPromise as unknown as Promise<RouteChangeFlushResult>);
    });
  });

  it("Discard All drops drafts and resolves 'proceed'", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);

    render(
      <Wrapper>
        <TestCard
          sessionId="discard-test"
          initial={{ value: "alpha" }}
          mutationFn={vi.fn(async (draft: TestDraft, version: number) => ({
            ...draft,
            version: version + 1,
          }))}
          dispatchValue="alpha-2"
          shouldDispatch
          label="Discard Card"
        />
        <OrchestratorProbe
          onReady={(orchestrator) => {
            captured = orchestrator;
          }}
        />
      </Wrapper>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const orchestrator = captured as unknown as EditSessionContextValue;
    let pending: Promise<RouteChangeFlushResult> | null = null;

    await act(async () => {
      pending = orchestrator.requestRouteChangeFlush();
    });

    await waitFor(() => {
      expect(screen.getByText("Discard Card")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /discard all/i }));
    });

    let outcome: RouteChangeFlushResult = "cancel";

    await act(async () => {
      outcome = await (pending as unknown as Promise<RouteChangeFlushResult>);
    });
    expect(outcome).toBe("proceed");
  });
});
