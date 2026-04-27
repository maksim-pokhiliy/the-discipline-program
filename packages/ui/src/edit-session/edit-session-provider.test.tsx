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

describe("EditSessionProvider — sessions and Cmd+S", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Cmd+S triggers save() on the focused session ONLY", async () => {
    const queryClient = new QueryClient();
    const Wrapper = buildOrchestratorWrapper(queryClient);
    const fnA = vi.fn(async (draft: TestDraft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const fnB = vi.fn(async (draft: TestDraft, version: number) => ({
      ...draft,
      version: version + 1,
    }));

    render(
      <Wrapper>
        <TestCard
          sessionId="a"
          initial={{ value: "alpha" }}
          mutationFn={fnA}
          dispatchValue="alpha-2"
          shouldDispatch
        />
        <TestCard
          sessionId="b"
          initial={{ value: "beta" }}
          mutationFn={fnB}
          dispatchValue="beta-2"
          shouldDispatch
        />
      </Wrapper>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const inputA = screen.getByTestId("input-a");

    inputA.focus();

    await act(async () => {
      fireEvent.keyDown(window, { key: "s", code: "KeyS", metaKey: true });
    });

    await waitFor(() => {
      expect(fnA).toHaveBeenCalledTimes(1);
    });
    expect(fnB).not.toHaveBeenCalled();
  });

  it("flushAll returns flushed and blocked session ids", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);
    const fnA = vi.fn(async (draft: TestDraft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const fnB = vi.fn();

    render(
      <Wrapper>
        <TestCard
          sessionId="card-a"
          initial={{ value: "alpha" }}
          mutationFn={fnA}
          dispatchValue="alpha-2"
          shouldDispatch
        />
        <TestCard
          sessionId="card-b"
          initial={{ value: "beta" }}
          mutationFn={fnB}
          dispatchValue=""
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

    expect(captured).not.toBeNull();
    const orchestrator = captured as unknown as EditSessionContextValue;

    let result: { flushed: string[]; blocked: string[] } = { flushed: [], blocked: [] };

    await act(async () => {
      result = await orchestrator.flushAll();
    });

    expect(result.flushed).toContain("card-a");
    expect(result.blocked).toContain("card-b");
    expect(fnB).not.toHaveBeenCalled();
  });

  it("flushSession resolves without error for an unregistered session id", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);

    render(
      <Wrapper>
        <OrchestratorProbe
          onReady={(orchestrator) => {
            captured = orchestrator;
          }}
        />
      </Wrapper>,
    );

    expect(captured).not.toBeNull();
    const orchestrator = captured as unknown as EditSessionContextValue;

    await act(async () => {
      await orchestrator.flushSession("does-not-exist");
    });
  });

  it("flushSession triggers save when session is in error state", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);
    const mutationFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("network failure"))
      .mockResolvedValue({ value: "alpha-2", version: 2 });

    render(
      <Wrapper>
        <TestCard
          sessionId="error-card"
          initial={{ value: "alpha" }}
          mutationFn={mutationFn}
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

    expect(captured).not.toBeNull();
    const orchestrator = captured as unknown as EditSessionContextValue;

    await act(async () => {
      await orchestrator.flushAll();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status-error-card")).toHaveTextContent("error");
    });

    await act(async () => {
      await orchestrator.flushSession("error-card");
    });

    await waitFor(() => {
      expect(mutationFn).toHaveBeenCalledTimes(2);
    });
  });

  it("requestRouteChangeFlush resolves 'proceed' when no draft is dirty", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);

    render(
      <Wrapper>
        <OrchestratorProbe
          onReady={(orchestrator) => {
            captured = orchestrator;
          }}
        />
      </Wrapper>,
    );

    expect(captured).not.toBeNull();
    const orchestrator = captured as unknown as EditSessionContextValue;
    let outcome: RouteChangeFlushResult = "cancel";

    await act(async () => {
      outcome = await orchestrator.requestRouteChangeFlush();
    });

    expect(outcome).toBe("proceed");
  });
});
