import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { EditSessionAwareLink } from "./edit-session-aware-link";
import { buildOrchestratorWrapper, OrchestratorProbe, TestCard } from "./test-utils";
import { type EditSessionContextValue } from "./types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/coach/plans/p1",
  useSearchParams: () => new URLSearchParams(),
}));

describe("EditSessionAwareLink", () => {
  afterEach(() => {
    pushMock.mockReset();
    vi.restoreAllMocks();
  });

  it("triggers requestRouteChangeFlush guard when href is a UrlObject and dispatches router.push", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);
    const flushSpy = vi.fn();

    render(
      <Wrapper>
        <TestCard
          sessionId="card-x"
          initial={{ value: "alpha" }}
          mutationFn={vi.fn(async (draft, version) => ({ ...draft, version: version + 1 }))}
          dispatchValue="alpha-2"
          shouldDispatch
          label="Card X"
        />
        <EditSessionAwareLink
          href={{ pathname: "/coach/library", query: { tab: "exercise" } }}
          data-testid="library-link"
        >
          Library
        </EditSessionAwareLink>
        <OrchestratorProbe
          onReady={(orchestrator) => {
            if (!captured) {
              captured = orchestrator;
              const original = orchestrator.requestRouteChangeFlush.bind(orchestrator);

              orchestrator.requestRouteChangeFlush = async () => {
                flushSpy();

                return original();
              };
            }
          }}
        />
      </Wrapper>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const link = screen.getByTestId("library-link");

    await act(async () => {
      fireEvent.click(link);
    });

    await waitFor(() => {
      expect(flushSpy).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save all/i }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/coach/library?tab=exercise");
    });
  });

  it("guards string href via flush + router.push", async () => {
    const queryClient = new QueryClient();
    let captured: EditSessionContextValue | null = null;
    const Wrapper = buildOrchestratorWrapper(queryClient);
    const flushSpy = vi.fn();

    render(
      <Wrapper>
        <TestCard
          sessionId="card-y"
          initial={{ value: "alpha" }}
          mutationFn={vi.fn(async (draft, version) => ({ ...draft, version: version + 1 }))}
          dispatchValue="alpha-2"
          shouldDispatch
        />
        <EditSessionAwareLink href="/coach/library" data-testid="library-link-string">
          Library
        </EditSessionAwareLink>
        <OrchestratorProbe
          onReady={(orchestrator) => {
            if (!captured) {
              captured = orchestrator;
              const original = orchestrator.requestRouteChangeFlush.bind(orchestrator);

              orchestrator.requestRouteChangeFlush = async () => {
                flushSpy();

                return original();
              };
            }
          }}
        />
      </Wrapper>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("library-link-string"));
    });

    await waitFor(() => {
      expect(flushSpy).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save all/i }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/coach/library");
    });
  });
});
