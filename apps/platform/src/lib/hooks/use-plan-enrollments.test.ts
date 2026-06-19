import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CreatePlanEnrollmentRequest,
  PlanEnrollment,
} from "@repo/contracts/lms/plan-enrollment";
import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const listByPlanMock = vi.fn<(planId: string) => Promise<{ enrollments: PlanEnrollment[] }>>();
const createMock =
  vi.fn<(planId: string, data: CreatePlanEnrollmentRequest) => Promise<PlanEnrollment>>();
const pauseMock = vi.fn<(planId: string, enrollmentId: string) => Promise<PlanEnrollment>>();
const resumeMock = vi.fn<(planId: string, enrollmentId: string) => Promise<PlanEnrollment>>();
const removeMock = vi.fn<(planId: string, enrollmentId: string) => Promise<void>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    planEnrollments: {
      listByPlan: (planId: string) => listByPlanMock(planId),
      create: (planId: string, data: CreatePlanEnrollmentRequest) => createMock(planId, data),
      pause: (planId: string, enrollmentId: string) => pauseMock(planId, enrollmentId),
      resume: (planId: string, enrollmentId: string) => resumeMock(planId, enrollmentId),
      remove: (planId: string, enrollmentId: string) => removeMock(planId, enrollmentId),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

vi.mock("@repo/query", async (importOriginal) => {
  const actual = await importOriginal<typeof Query>();

  return {
    ...actual,
    notifyError: (error: Error, fallback: string) => notifyErrorMock(error, fallback),
  };
});

const {
  toBoardedAt,
  usePlanEnrollments,
  useCreateEnrollment,
  usePauseEnrollment,
  useResumeEnrollment,
  useRemoveEnrollment,
} = await import("./use-plan-enrollments");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const ATHLETE_ID = "clp9z8x7w0000abcd1234athl";
const ENROLLMENT_ID = "clp9z8x7w0000abcd1234enrl";

const makeEnrollment = (overrides: Partial<PlanEnrollment> = {}): PlanEnrollment => ({
  id: ENROLLMENT_ID,
  planId: PLAN_ID,
  athleteId: ATHLETE_ID,
  enrolledById: "clp9z8x7w0000abcd1234coch",
  boardedAt: new Date("2026-03-09T00:00:00.000Z"),
  status: EnrollmentStatus.ACTIVE,
  statusChangedAt: new Date("2026-03-09T00:00:00.000Z"),
  hidePastBeforeBoarding: false,
  createdAt: new Date("2026-03-09T00:00:00.000Z"),
  updatedAt: new Date("2026-03-09T00:00:00.000Z"),
  ...overrides,
});

const renderRunner = <THook>(hook: () => THook) => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(hook, { wrapper });

  return { view, invalidateSpy };
};

beforeEach(() => {
  listByPlanMock.mockReset();
  createMock.mockReset();
  pauseMock.mockReset();
  resumeMock.mockReset();
  removeMock.mockReset();
  toastSuccessMock.mockReset();
  notifyErrorMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toBoardedAt", () => {
  it("pins a local-midnight picker date to UTC midnight of the same calendar day", () => {
    const pickerDate = new Date(2026, 2, 9);

    const boardedAt = toBoardedAt(pickerDate);

    expect(boardedAt.toISOString()).toBe("2026-03-09T00:00:00.000Z");
  });
});

describe("useCreateEnrollment", () => {
  it("sends a UTC-midnight boardedAt for the chosen calendar day", async () => {
    createMock.mockResolvedValueOnce(makeEnrollment());

    const { view } = renderRunner(() => useCreateEnrollment(PLAN_ID));

    const pickerDate = new Date(2026, 2, 9);
    const body: CreatePlanEnrollmentRequest = {
      athleteId: ATHLETE_ID,
      boardedAt: toBoardedAt(pickerDate),
      hidePastBeforeBoarding: false,
    };

    await act(async () => {
      view.result.current.mutate(body);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(createMock).toHaveBeenCalledTimes(1);

    const call = createMock.mock.calls.at(0);

    if (call === undefined) {
      throw new Error("expected create to have been called");
    }

    const [calledPlanId, calledBody] = call;

    expect(calledPlanId).toBe(PLAN_ID);
    expect(calledBody.athleteId).toBe(ATHLETE_ID);
    expect(calledBody.boardedAt.toISOString()).toBe("2026-03-09T00:00:00.000Z");
    expect(calledBody.boardedAt.toISOString().endsWith("T00:00:00.000Z")).toBe(true);
  });

  it("does not toast or notify on its own (the batch owns outcomes)", async () => {
    createMock.mockResolvedValueOnce(makeEnrollment());

    const { view, invalidateSpy } = renderRunner(() => useCreateEnrollment(PLAN_ID));

    await act(async () => {
      view.result.current.mutate({
        athleteId: ATHLETE_ID,
        boardedAt: toBoardedAt(new Date()),
        hidePastBeforeBoarding: false,
      });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(notifyErrorMock).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("usePauseEnrollment", () => {
  it("pauses with (planId, enrollmentId), invalidates both caches, toasts success", async () => {
    pauseMock.mockResolvedValueOnce(makeEnrollment({ status: EnrollmentStatus.PAUSED }));

    const { view, invalidateSpy } = renderRunner(() => usePauseEnrollment(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(ENROLLMENT_ID);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(pauseMock).toHaveBeenCalledWith(PLAN_ID, ENROLLMENT_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.planEnrollments.byPlan(PLAN_ID),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.athletes.page() });
    expect(toastSuccessMock).toHaveBeenCalledWith("Enrollment paused");
  });

  it("notifies the error fallback when the pause rejects", async () => {
    const failure = new Error("boom");

    pauseMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => usePauseEnrollment(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(ENROLLMENT_ID);
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't pause — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});

describe("useResumeEnrollment", () => {
  it("resumes with (planId, enrollmentId), invalidates both caches, toasts success", async () => {
    resumeMock.mockResolvedValueOnce(makeEnrollment({ status: EnrollmentStatus.ACTIVE }));

    const { view, invalidateSpy } = renderRunner(() => useResumeEnrollment(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(ENROLLMENT_ID);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(resumeMock).toHaveBeenCalledWith(PLAN_ID, ENROLLMENT_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.planEnrollments.byPlan(PLAN_ID),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.athletes.page() });
    expect(toastSuccessMock).toHaveBeenCalledWith("Enrollment resumed");
  });

  it("notifies the error fallback when the resume rejects", async () => {
    const failure = new Error("boom");

    resumeMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => useResumeEnrollment(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(ENROLLMENT_ID);
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't resume — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});

describe("useRemoveEnrollment", () => {
  it("removes with (planId, enrollmentId), invalidates both caches, toasts success", async () => {
    removeMock.mockResolvedValueOnce(undefined);

    const { view, invalidateSpy } = renderRunner(() => useRemoveEnrollment(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(ENROLLMENT_ID);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(removeMock).toHaveBeenCalledWith(PLAN_ID, ENROLLMENT_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.planEnrollments.byPlan(PLAN_ID),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.athletes.page() });
    expect(toastSuccessMock).toHaveBeenCalledWith("Removed from plan");
  });

  it("notifies the error fallback when the remove rejects", async () => {
    const failure = new Error("boom");

    removeMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => useRemoveEnrollment(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(ENROLLMENT_ID);
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't remove — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});

describe("usePlanEnrollments", () => {
  it("unwraps the enrollments array from the list response", async () => {
    const enrollments = [makeEnrollment()];

    listByPlanMock.mockResolvedValueOnce({ enrollments });

    const { view } = renderRunner(() => usePlanEnrollments(PLAN_ID));

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(listByPlanMock).toHaveBeenCalledWith(PLAN_ID);
    expect(view.result.current.data).toEqual(enrollments);
  });

  it("stays disabled when the plan id is empty", () => {
    const { view } = renderRunner(() => usePlanEnrollments(""));

    expect(listByPlanMock).not.toHaveBeenCalled();
    expect(view.result.current.fetchStatus).toBe("idle");
  });
});
