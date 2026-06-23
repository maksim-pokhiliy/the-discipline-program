import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SendEmailInput } from "@repo/email";

const mocks = vi.hoisted(() => {
  const sendMock = vi.fn<(input: unknown) => Promise<{ id: string }>>(async () => ({
    id: "test-id",
  }));

  return {
    sendMock,
    createResendServiceMock: vi.fn(() => ({ send: sendMock })),
    renderEmailMock: vi.fn(async () => ({
      subject: "New program lead",
      html: "<html>rendered</html>",
      text: "rendered",
    })),
    findFirstMock: vi.fn<() => Promise<{ email: string; name: string | null } | null>>(
      async () => ({
        email: "head-coach@example.com",
        name: "Denys",
      }),
    ),
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

vi.mock("@repo/email", () => ({
  createResendEmailService: mocks.createResendServiceMock,
  renderEmail: mocks.renderEmailMock,
  leadNotificationEmail: { __template: "lead-notification" },
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

vi.mock("../../../db/client", () => ({
  prisma: {
    user: { findFirst: mocks.findFirstMock },
    $disconnect: async () => undefined,
  },
}));

const { sendLeadNotificationEmail, resolveLeadEmailConfig } = await import(
  "./send-lead-notification-email"
);

const testInput = {
  program: "strength-base",
  contact: "tg:@athlete",
  message: "I want to join",
  name: "Sam",
};

describe("resolveLeadEmailConfig", () => {
  beforeEach(() => {
    mocks.emailEnvOverride.RESEND_API_KEY = "test-api-key";
    mocks.emailEnvOverride.EMAIL_FROM = "noreply@example.com";
    mocks.emailEnvOverride.EMAIL_REPLY_TO = undefined;
  });

  it("returns the config when both RESEND_API_KEY and EMAIL_FROM are set", () => {
    const config = resolveLeadEmailConfig();

    expect(config).not.toBeNull();
    expect(config?.apiKey).toBe("test-api-key");
    expect(config?.from).toEqual({ email: "noreply@example.com" });
  });

  it("returns null (does NOT throw) when RESEND_API_KEY is missing", () => {
    mocks.emailEnvOverride.RESEND_API_KEY = undefined;

    expect(resolveLeadEmailConfig()).toBeNull();
  });

  it("returns null (does NOT throw) when EMAIL_FROM is missing", () => {
    mocks.emailEnvOverride.EMAIL_FROM = undefined;

    expect(resolveLeadEmailConfig()).toBeNull();
  });

  it("includes replyTo in config when EMAIL_REPLY_TO is set", () => {
    mocks.emailEnvOverride.EMAIL_REPLY_TO = "reply@example.com";

    const config = resolveLeadEmailConfig();

    expect(config?.replyTo).toEqual({ email: "reply@example.com" });
  });
});

describe("sendLeadNotificationEmail", () => {
  beforeEach(() => {
    mocks.emailEnvOverride.RESEND_API_KEY = "test-api-key";
    mocks.emailEnvOverride.EMAIL_FROM = "noreply@example.com";
    mocks.emailEnvOverride.EMAIL_REPLY_TO = undefined;
    mocks.findFirstMock.mockImplementation(async () => ({
      email: "head-coach@example.com",
      name: "Denys",
    }));
    mocks.sendMock.mockClear();
    mocks.sendMock.mockImplementation(async () => ({ id: "test-id" }));
    mocks.createResendServiceMock.mockClear();
    mocks.renderEmailMock.mockClear();
    mocks.loggerErrorMock.mockClear();
    mocks.loggerWarnMock.mockClear();
    mocks.loggerInfoMock.mockClear();
  });

  it("renders and sends to the head coach when a coach and email env exist", async () => {
    await sendLeadNotificationEmail(testInput);

    expect(mocks.renderEmailMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);

    const sendCall = mocks.sendMock.mock.calls[0];

    expect(sendCall).toBeDefined();

    const sendArgs = sendCall ? (sendCall[0] as TypedSendInput) : undefined;

    expect(sendArgs?.to).toEqual({ email: "head-coach@example.com" });
    expect(sendArgs?.subject.toLowerCase()).toContain("lead");
  });

  it("renders the lead template with the head-coach name and program details", async () => {
    await sendLeadNotificationEmail(testInput);

    expect(mocks.renderEmailMock).toHaveBeenCalledWith(
      { __template: "lead-notification" },
      expect.objectContaining({
        program: "strength-base",
        contact: "tg:@athlete",
        recipientName: "Denys",
        message: "I want to join",
      }),
    );
  });

  it("logs lead.no_head_coach and does not send when there is no head coach", async () => {
    mocks.findFirstMock.mockImplementationOnce(async () => null);

    await expect(sendLeadNotificationEmail(testInput)).resolves.toBeUndefined();

    expect(mocks.loggerInfoMock).toHaveBeenCalledWith(
      "lead.no_head_coach",
      expect.objectContaining({ program: "strength-base" }),
    );
    expect(mocks.renderEmailMock).not.toHaveBeenCalled();
    expect(mocks.sendMock).not.toHaveBeenCalled();
  });

  it("logs lead.email_config_missing and RESOLVES when email env is missing", async () => {
    mocks.emailEnvOverride.RESEND_API_KEY = undefined;
    mocks.emailEnvOverride.EMAIL_FROM = undefined;

    await expect(sendLeadNotificationEmail(testInput)).resolves.toBeUndefined();

    expect(mocks.loggerWarnMock).toHaveBeenCalledWith(
      "lead.email_config_missing",
      expect.objectContaining({ program: "strength-base" }),
    );
    expect(mocks.sendMock).not.toHaveBeenCalled();
  });

  it("logs lead.email_send_failed and resolves when the Resend send itself fails", async () => {
    mocks.sendMock.mockImplementationOnce(async () => {
      throw new Error("Network down");
    });

    await expect(sendLeadNotificationEmail(testInput)).resolves.toBeUndefined();

    expect(mocks.loggerErrorMock).toHaveBeenCalledWith(
      "lead.email_send_failed",
      expect.objectContaining({ program: "strength-base" }),
    );
  });

  it("never leaks the head-coach email address into any logger call", async () => {
    mocks.sendMock.mockImplementationOnce(async () => {
      throw new Error("Network down");
    });

    await sendLeadNotificationEmail(testInput);

    const loggedArgs = JSON.stringify([
      ...mocks.loggerInfoMock.mock.calls,
      ...mocks.loggerWarnMock.mock.calls,
      ...mocks.loggerErrorMock.mock.calls,
    ]);

    expect(mocks.loggerErrorMock).toHaveBeenCalled();
    expect(loggedArgs).not.toContain("head-coach@example.com");
  });
});
