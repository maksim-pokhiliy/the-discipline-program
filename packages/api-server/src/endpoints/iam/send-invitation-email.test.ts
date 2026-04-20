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
    renderInvitationEmailMock: vi.fn(async () => ({
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
  renderInvitationEmail: mocks.renderInvitationEmailMock,
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

const { sendInvitationEmail, resolveInviteEmailConfig } = await import("./send-invitation-email");

const testInput = {
  userId: "user-id-1",
  recipientEmail: "invitee@example.com",
  recipientName: "Invitee",
  plainToken: "plain-token-long-enough-to-pass-32-byte-minimum-please",
  expiresInHours: 72,
};

describe("resolveInviteEmailConfig", () => {
  beforeEach(() => {
    mocks.emailEnvOverride.RESEND_API_KEY = "test-api-key";
    mocks.emailEnvOverride.EMAIL_FROM = "noreply@example.com";
    mocks.emailEnvOverride.EMAIL_REPLY_TO = undefined;
  });

  it("returns the config when both RESEND_API_KEY and EMAIL_FROM are set", () => {
    const config = resolveInviteEmailConfig();

    expect(config.apiKey).toBe("test-api-key");
    expect(config.from).toEqual({ email: "noreply@example.com" });
  });

  it("throws InternalServerError when RESEND_API_KEY is missing", () => {
    mocks.emailEnvOverride.RESEND_API_KEY = undefined;

    expect(() => resolveInviteEmailConfig()).toThrow(InternalServerError);
  });

  it("throws InternalServerError when EMAIL_FROM is missing", () => {
    mocks.emailEnvOverride.EMAIL_FROM = undefined;

    expect(() => resolveInviteEmailConfig()).toThrow(InternalServerError);
  });

  it("includes replyTo in config when EMAIL_REPLY_TO is set", () => {
    mocks.emailEnvOverride.EMAIL_REPLY_TO = "reply@example.com";

    const config = resolveInviteEmailConfig();

    expect(config.replyTo).toEqual({ email: "reply@example.com" });
  });
});

describe("sendInvitationEmail", () => {
  beforeEach(() => {
    mocks.emailEnvOverride.RESEND_API_KEY = "test-api-key";
    mocks.emailEnvOverride.EMAIL_FROM = "noreply@example.com";
    mocks.emailEnvOverride.EMAIL_REPLY_TO = undefined;
    mocks.sendMock.mockClear();
    mocks.createResendServiceMock.mockClear();
    mocks.renderInvitationEmailMock.mockClear();
    mocks.loggerErrorMock.mockClear();
  });

  afterEach(() => {
    mocks.sendMock.mockImplementation(async () => ({ id: "test-id" }));
  });

  it("sends a rendered invitation email via the Resend email service", async () => {
    await sendInvitationEmail(testInput);

    expect(mocks.renderInvitationEmailMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);

    const sendCall = mocks.sendMock.mock.calls[0];

    expect(sendCall).toBeDefined();

    const sendArgs = sendCall ? (sendCall[0] as TypedSendInput) : undefined;

    expect(sendArgs?.to).toEqual({ email: "invitee@example.com" });
    expect(sendArgs?.subject).toContain("invited");

    const sendResult: TypedSendResult = (await mocks.sendMock.mock.results[0]?.value) ?? {
      id: "fallback",
    };

    expect(sendResult.id).toBeDefined();
  });

  it("throws InternalServerError when config is missing (does NOT swallow)", async () => {
    mocks.emailEnvOverride.RESEND_API_KEY = undefined;
    mocks.emailEnvOverride.EMAIL_FROM = undefined;

    await expect(sendInvitationEmail(testInput)).rejects.toThrow(InternalServerError);

    expect(mocks.sendMock).not.toHaveBeenCalled();
  });

  it("logs error and resolves (does not rethrow) when Resend send itself fails", async () => {
    mocks.sendMock.mockImplementationOnce(async () => {
      throw new Error("Network down");
    });

    await expect(sendInvitationEmail(testInput)).resolves.toBeUndefined();

    expect(mocks.loggerErrorMock).toHaveBeenCalledWith(
      "invite.email_send_failed",
      expect.objectContaining({ userId: "user-id-1" }),
    );
  });
});
