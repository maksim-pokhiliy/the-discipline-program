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
const SAVE_FAILURE_MESSAGE = "Failed to save 1RM";
const IDEMPOTENCY_MISMATCH_MESSAGE = "Idempotency-Key reuse with different request body";
const LOST_RESPONSE_MESSAGE = "response lost";
const ONE_RECORD = 1;
const TWO_RECORDS = 2;

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

type IdempotentServer = {
  handle: (
    data: CreateOneRMRecordRequest,
    idempotencyKey?: string,
  ) => Promise<CreateOneRMRecordResponse>;
  countRecords: () => number;
};

const createIdempotentServer = (): IdempotentServer => {
  const cacheByKey = new Map<
    string,
    { fingerprint: string; response: CreateOneRMRecordResponse }
  >();
  let writtenRecords = 0;

  const handle = (
    data: CreateOneRMRecordRequest,
    idempotencyKey?: string,
  ): Promise<CreateOneRMRecordResponse> => {
    const fingerprint = JSON.stringify(data);
    const cached = idempotencyKey === undefined ? undefined : cacheByKey.get(idempotencyKey);

    if (cached !== undefined) {
      return cached.fingerprint === fingerprint
        ? Promise.resolve(cached.response)
        : Promise.reject(new Error(IDEMPOTENCY_MISMATCH_MESSAGE));
    }

    const response = makeOneRMResponse({ valueKg: data.valueKg });

    writtenRecords += 1;

    if (idempotencyKey !== undefined) {
      cacheByKey.set(idempotencyKey, { fingerprint, response });
    }

    return Promise.resolve(response);
  };

  return { handle, countRecords: (): number => writtenRecords };
};

const mockServerWithLostFirstResponse = (server: IdempotentServer): void => {
  createOneRMRecordMock
    .mockImplementationOnce(async (data, idempotencyKey) => {
      await server.handle(data, idempotencyKey);

      throw new Error(LOST_RESPONSE_MESSAGE);
    })
    .mockImplementation((data, idempotencyKey) => server.handle(data, idempotencyKey));
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

  it("reuses the idempotency key while a submit of the same value is in flight", async () => {
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

  it("replays the persisted write when the same value is retried after a lost response", async () => {
    const server = createIdempotentServer();

    mockServerWithLostFirstResponse(server);

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest()).catch(() => undefined);
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(keyAt(1)).toBe(keyAt(0));
    expect(server.countRecords()).toBe(ONE_RECORD);
    expect(notifyErrorMock).toHaveBeenCalledWith(expect.any(Error), SAVE_FAILURE_MESSAGE);
  });

  it("lets a corrected value through after a persisted-but-unseen 2xx instead of conflicting", async () => {
    const server = createIdempotentServer();

    mockServerWithLostFirstResponse(server);

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest()).catch(() => undefined);
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest({ valueKg: CORRECTED_VALUE_KG }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(keyAt(1)).not.toBe(keyAt(0));
    expect(server.countRecords()).toBe(TWO_RECORDS);
    expect(notifyErrorMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: IDEMPOTENCY_MISMATCH_MESSAGE }),
      expect.any(String),
    );
  });

  it("writes a second record when the same value is logged again after a successful save", async () => {
    const server = createIdempotentServer();

    createOneRMRecordMock.mockImplementation((data, idempotencyKey) =>
      server.handle(data, idempotencyKey),
    );

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).not.toBe(keyAt(0));
    expect(server.countRecords()).toBe(TWO_RECORDS);
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
