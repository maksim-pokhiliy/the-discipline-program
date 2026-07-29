import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CreateOneRMRecordRequest,
  type CreateOneRMRecordResponse,
  OneRMRecordSource,
} from "@repo/contracts/lms/one-rm-record";
import type * as Query from "@repo/query";

import { DatePickerStub } from "@app/test/date-picker-stub";
import { render } from "@app/test/render";

const createOneRMRecordMock =
  vi.fn<
    (data: CreateOneRMRecordRequest, idempotencyKey?: string) => Promise<CreateOneRMRecordResponse>
  >();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    oneRMRecords: {
      create: (data: CreateOneRMRecordRequest, idempotencyKey?: string) =>
        createOneRMRecordMock(data, idempotencyKey),
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

vi.mock("@mui/x-date-pickers/DatePicker", () => ({ DatePicker: DatePickerStub }));

const { useCreateOneRMRecord } = await import("./use-one-rm-records");
const { UpdateOneRmForm } = await import("@app/modules/athlete-records/components");

const EXERCISE_ID = "clp9z8x7w0000abcd1234exrc";
const MOVEMENT_NAME = "Back Squat";
const CORRECTED_VALUE_KG = 120;
const VALUE_FIELD_LABEL = "Value (kg)";
const SAVE_BUTTON_LABEL = "Save Record";
const ONE_RM_SAVED_MESSAGE = "1RM saved";
const IDEMPOTENCY_MISMATCH_MESSAGE = "Idempotency-Key reuse with different request body";

const makeOneRMRequest = (
  overrides: Partial<CreateOneRMRecordRequest> = {},
): CreateOneRMRecordRequest => ({
  exerciseId: EXERCISE_ID,
  valueKg: 100,
  recordedAt: new Date("2026-01-06T00:00:00.000Z"),
  source: OneRMRecordSource.MANUAL,
  ...overrides,
});

const makeOneRMResponse = (
  overrides: Partial<CreateOneRMRecordResponse> = {},
): CreateOneRMRecordResponse => ({
  id: "clp9z8x7w0000abcd1234rec0",
  userId: "clp9z8x7w0000abcd1234usr0",
  exerciseId: EXERCISE_ID,
  valueKg: 100,
  recordedAt: new Date("2026-01-06T00:00:00.000Z"),
  source: OneRMRecordSource.MANUAL,
  ...overrides,
});

type IdempotentServer = (
  data: CreateOneRMRecordRequest,
  idempotencyKey?: string,
) => Promise<CreateOneRMRecordResponse>;

const createIdempotentServer = (): IdempotentServer => {
  const fingerprintByKey = new Map<string, string>();

  return (data, idempotencyKey) => {
    const fingerprint = JSON.stringify(data);
    const stored = idempotencyKey === undefined ? undefined : fingerprintByKey.get(idempotencyKey);

    if (stored !== undefined && stored !== fingerprint) {
      return Promise.reject(new Error(IDEMPOTENCY_MISMATCH_MESSAGE));
    }

    if (idempotencyKey !== undefined) {
      fingerprintByKey.set(idempotencyKey, fingerprint);
    }

    return Promise.resolve(makeOneRMResponse({ valueKg: data.valueKg }));
  };
};

const renderRunner = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useCreateOneRMRecord(), { wrapper });
};

const renderRecordsForm = (onClose: () => void) =>
  render(
    createElement(UpdateOneRmForm, {
      movements: [{ exerciseId: EXERCISE_ID, exerciseName: MOVEMENT_NAME }],
      presetExerciseId: EXERCISE_ID,
      onClose,
    }),
  );

const keyAt = (index: number): string | undefined => createOneRMRecordMock.mock.calls[index]?.[1];

describe("useCreateOneRMRecord", () => {
  beforeEach(() => {
    createOneRMRecordMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses the idempotency key across retries until the submit settles", async () => {
    createOneRMRecordMock.mockReturnValue(new Promise<CreateOneRMRecordResponse>(() => undefined));

    const { result } = renderRunner();

    await act(async () => {
      result.current.mutate(makeOneRMRequest());
      result.current.mutate(makeOneRMRequest());
    });

    await waitFor(() => expect(createOneRMRecordMock).toHaveBeenCalledTimes(2));

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).toBe(keyAt(0));
  });

  it("mints a new key after a successful submit", async () => {
    createOneRMRecordMock.mockResolvedValue(makeOneRMResponse());

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).not.toBe(keyAt(0));
  });

  it("mints a new key after a failed submit", async () => {
    createOneRMRecordMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(makeOneRMResponse());

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest()).catch(() => undefined);
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).not.toBe(keyAt(0));
    expect(notifyErrorMock).toHaveBeenCalledWith(expect.any(Error), "Failed to save 1RM");
  });

  it("lets a corrected value through after a persisted-but-unseen 2xx instead of conflicting", async () => {
    const server = createIdempotentServer();

    createOneRMRecordMock
      .mockImplementationOnce(async (data, idempotencyKey) => {
        await server(data, idempotencyKey);

        throw new Error("response lost");
      })
      .mockImplementation((data, idempotencyKey) => server(data, idempotencyKey));

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest()).catch(() => undefined);
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest({ valueKg: CORRECTED_VALUE_KG }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(keyAt(1)).not.toBe(keyAt(0));
    expect(notifyErrorMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: IDEMPOTENCY_MISMATCH_MESSAGE }),
      expect.any(String),
    );
  });

  it("isolates the key per exercise so a held key never poisons another exercise", async () => {
    createOneRMRecordMock.mockReturnValue(new Promise<CreateOneRMRecordResponse>(() => undefined));

    const { result } = renderRunner();
    const otherExercise = "clp9z8x7w0000abcd1234exr2";

    await act(async () => {
      result.current.mutate(makeOneRMRequest());
      result.current.mutate(makeOneRMRequest({ exerciseId: otherExercise }));
    });

    await waitFor(() => expect(createOneRMRecordMock).toHaveBeenCalledTimes(2));

    expect(typeof keyAt(0)).toBe("string");
    expect(typeof keyAt(1)).toBe("string");
    expect(keyAt(1)).not.toBe(keyAt(0));
  });

  it("fires no success toast of its own", async () => {
    createOneRMRecordMock.mockResolvedValue(makeOneRMResponse());

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});

describe("the 1RM save receipt", () => {
  beforeEach(() => {
    createOneRMRecordMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fires exactly once per save from the Records form", async () => {
    createOneRMRecordMock.mockResolvedValue(makeOneRMResponse());

    const onClose = vi.fn();

    renderRecordsForm(onClose);

    fireEvent.change(screen.getByLabelText(VALUE_FIELD_LABEL), {
      target: { value: String(CORRECTED_VALUE_KG) },
    });
    fireEvent.click(screen.getByRole("button", { name: SAVE_BUTTON_LABEL }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(ONE_RM_SAVED_MESSAGE);
  });
});
