import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SendEmailInput, SendEmailResult } from "@repo/email";
import { InternalServerError } from "@repo/errors";

const mocks = vi.hoisted(() => {
  const sendMock = vi.fn<(input: unknown) => Promise<{ id: string }>>(async () => ({
    id: "test-id",
  }));

  return {
    sendMock,
    createResendServiceMock: vi.fn(() => ({ send: sendMock })),
    renderEmailMock: vi.fn(async () => ({
      subject: "Reset your password",
      html: "<html>rendered</html>",
      text: "rendered",
    })),
    loggerErrorMock: vi.fn(),
    loggerWarnMock: vi.fn(),
    loggerInfoMock: vi.fn(),
    emailEnvOverride: {
      RESEND_API_KEY: "test-api-key" as string | undefined,
      EMAIL_FROM: "noreply@example.com" as string | undefined,
      EMAIL_REPLY_TO: undefined as string | undefined,
    },
  };
});

type TypedSendInput = SendEmailInput;
type TypedSendResult = SendEmailResult;

vi.mock("@repo/email", () => ({
  createResendEmailService: mocks.createResendServiceMock,
  renderEmail: mocks.renderEmailMock,
  passwordResetEmail: { __template: "password-reset" },
}));

vi.mock("@repo/env/email", () => ({
  get emailEnv() {
    return mocks.emailEnvOverride;
  },
}));

vi.mock("@repo/shared", () => ({
  logger: {
    error: mocks.loggerErrorMock,
    warn: mocks.loggerWarnMock,
    info: mocks.loggerInfoMock,
  },
}));

const { sendPasswordResetEmail } = await import("./send-password-reset-email");

const testInput = {
  userId: "user-id-1",
  recipientEmail: "user@example.com",
  recipientName: "User",
  plainToken: "plain-token-long-enough-to-pass-32-byte-minimum-please",
  expiresInHours: 1,
};

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    mocks.emailEnvOverride.RESEND_API_KEY = "test-api-key";
    mocks.emailEnvOverride.EMAIL_FROM = "noreply@example.com";
    mocks.emailEnvOverride.EMAIL_REPLY_TO = undefined;
    mocks.sendMock.mockClear();
    mocks.createResendServiceMock.mockClear();
    mocks.renderEmailMock.mockClear();
    mocks.loggerErrorMock.mockClear();
  });

  afterEach(() => {
    mocks.sendMock.mockImplementation(async () => ({ id: "test-id" }));
  });

  it("sends a rendered password-reset email via the Resend email service", async () => {
    await sendPasswordResetEmail(testInput);

    expect(mocks.renderEmailMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);

    const sendCall = mocks.sendMock.mock.calls[0];

    expect(sendCall).toBeDefined();

    const sendArgs = sendCall ? (sendCall[0] as TypedSendInput) : undefined;

    expect(sendArgs?.to).toEqual({ email: "user@example.com" });
    expect(sendArgs?.subject).toBe("Reset your password");

    const sendResult: TypedSendResult = (await mocks.sendMock.mock.results[0]?.value) ?? {
      id: "fallback",
    };

    expect(sendResult.id).toBeDefined();
  });

  it("renders the password-reset template with the reset URL built from the plain token", async () => {
    await sendPasswordResetEmail(testInput);

    expect(mocks.renderEmailMock).toHaveBeenCalledWith(
      { __template: "password-reset" },
      expect.objectContaining({
        resetUrl: expect.stringContaining(`/reset-password/${testInput.plainToken}`),
        recipientName: "User",
        expiresInHours: 1,
      }),
    );
  });

  it("throws InternalServerError when config is missing (does NOT swallow)", async () => {
    mocks.emailEnvOverride.RESEND_API_KEY = undefined;
    mocks.emailEnvOverride.EMAIL_FROM = undefined;

    await expect(sendPasswordResetEmail(testInput)).rejects.toThrow(InternalServerError);

    expect(mocks.renderEmailMock).not.toHaveBeenCalled();
    expect(mocks.sendMock).not.toHaveBeenCalled();
  });

  it("logs error and resolves (does not rethrow) when Resend send itself fails", async () => {
    mocks.sendMock.mockImplementationOnce(async () => {
      throw new Error("Network down");
    });

    await expect(sendPasswordResetEmail(testInput)).resolves.toBeUndefined();

    expect(mocks.loggerErrorMock).toHaveBeenCalledWith(
      "password_reset.email_send_failed",
      expect.objectContaining({ userId: "user-id-1" }),
    );
  });
});
