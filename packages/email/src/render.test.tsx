import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { renderEmail } from "./render";
import { invitationEmail, type InvitationEmailProps } from "./templates/invitation";
import {
  leadNotificationEmail,
  type LeadNotificationEmailProps,
} from "./templates/lead-notification";
import { passwordResetEmail, type PasswordResetEmailProps } from "./templates/password-reset";

const INVITE_URL = "https://app.thedisciplineprogram.com/invite/secret-invite-token-abc123";
const RESET_URL = "https://app.thedisciplineprogram.com/reset-password/secret-reset-token-xyz789";

const WORDMARK = "THE DISCIPLINE PROGRAM";

const SCRIPT_PAYLOAD = "<script>alert(1)</script>";
const IMG_PAYLOAD = "<img src=x onerror=alert(1)>";
const ESCAPED_SCRIPT = "&lt;script&gt;";
const ESCAPED_IMG = "&lt;img src=x onerror=alert(1)&gt;";
const RAW_IMG_TAG = "<img src=x onerror";

const makeInvitationProps = (
  overrides: Partial<InvitationEmailProps> = {},
): InvitationEmailProps => ({
  inviteUrl: INVITE_URL,
  recipientName: "Alex",
  expiresInHours: 48,
  ...overrides,
});

const makePasswordResetProps = (
  overrides: Partial<PasswordResetEmailProps> = {},
): PasswordResetEmailProps => ({
  resetUrl: RESET_URL,
  recipientName: "Alex",
  expiresInHours: 1,
  ...overrides,
});

const makeLeadProps = (
  overrides: Partial<LeadNotificationEmailProps> = {},
): LeadNotificationEmailProps => ({
  program: "12-Week Strength Block",
  contact: "alex@example.com",
  message: "Looking to start next month.",
  recipientName: "Coach",
  ...overrides,
});

describe("renderEmail", () => {
  it("returns subject, html, and text for a descriptor", async () => {
    const result = await renderEmail(invitationEmail, makeInvitationProps());

    expect(typeof result.subject).toBe("string");
    expect(result.html.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("wraps every email in the branded text wordmark chrome", async () => {
    const result = await renderEmail(invitationEmail, makeInvitationProps());

    expect(result.html).toContain(WORDMARK);
    expect(result.text).toContain(WORDMARK);
  });

  it("renders image-free chrome (text wordmark, no img tag)", async () => {
    const results = await Promise.all([
      renderEmail(invitationEmail, makeInvitationProps()),
      renderEmail(passwordResetEmail, makePasswordResetProps()),
      renderEmail(leadNotificationEmail, makeLeadProps()),
    ]);

    for (const result of results) {
      expect(result.html).not.toContain("<img");
    }
  });
});

describe("invitationEmail", () => {
  it("has the exact subject", async () => {
    const result = await renderEmail(invitationEmail, makeInvitationProps());

    expect(result.subject).toBe("You've been invited");
  });

  it("includes the invite CTA url in the html", async () => {
    const result = await renderEmail(invitationEmail, makeInvitationProps());

    expect(result.html).toContain(INVITE_URL);
  });

  it("keeps the invite url in the plain-text output", async () => {
    const result = await renderEmail(invitationEmail, makeInvitationProps());

    expect(result.text).toContain(INVITE_URL);
  });

  it("greets by name when a recipient name is given", async () => {
    const result = await renderEmail(
      invitationEmail,
      makeInvitationProps({ recipientName: "Alex" }),
    );

    expect(result.html).toContain("Hi Alex,");
  });

  it("greets with 'Hi,' when recipient name is null", async () => {
    const result = await renderEmail(invitationEmail, makeInvitationProps({ recipientName: null }));

    expect(result.html).toContain("Hi,");
  });

  it("greets with 'Hi,' when recipient name is omitted", async () => {
    const result = await renderEmail(invitationEmail, {
      inviteUrl: INVITE_URL,
      expiresInHours: 48,
    });

    expect(result.html).toContain("Hi,");
  });

  it("escapes script and img payloads in the recipient name", async () => {
    const result = await renderEmail(
      invitationEmail,
      makeInvitationProps({ recipientName: `${SCRIPT_PAYLOAD}${IMG_PAYLOAD}` }),
    );

    expect(result.html).not.toContain(SCRIPT_PAYLOAD);
    expect(result.html).not.toContain(RAW_IMG_TAG);
    expect(result.html).not.toContain("<img");
    expect(result.html).toContain(ESCAPED_SCRIPT);
    expect(result.html).toContain(ESCAPED_IMG);
  });
});

describe("passwordResetEmail", () => {
  it("has the exact subject", async () => {
    const result = await renderEmail(passwordResetEmail, makePasswordResetProps());

    expect(result.subject).toBe("Reset your password");
  });

  it("includes the reset CTA url in the html", async () => {
    const result = await renderEmail(passwordResetEmail, makePasswordResetProps());

    expect(result.html).toContain(RESET_URL);
  });

  it("keeps the reset url in the plain-text output", async () => {
    const result = await renderEmail(passwordResetEmail, makePasswordResetProps());

    expect(result.text).toContain(RESET_URL);
  });

  it("greets with 'Hi,' when recipient name is null", async () => {
    const result = await renderEmail(
      passwordResetEmail,
      makePasswordResetProps({ recipientName: null }),
    );

    expect(result.html).toContain("Hi,");
  });

  it("escapes script and img payloads in the recipient name", async () => {
    const result = await renderEmail(
      passwordResetEmail,
      makePasswordResetProps({ recipientName: `${SCRIPT_PAYLOAD}${IMG_PAYLOAD}` }),
    );

    expect(result.html).not.toContain(SCRIPT_PAYLOAD);
    expect(result.html).not.toContain(RAW_IMG_TAG);
    expect(result.html).not.toContain("<img");
    expect(result.html).toContain(ESCAPED_SCRIPT);
    expect(result.html).toContain(ESCAPED_IMG);
  });
});

describe("leadNotificationEmail", () => {
  it("has the exact subject", async () => {
    const result = await renderEmail(leadNotificationEmail, makeLeadProps());

    expect(result.subject).toBe("New program lead");
  });

  it("keeps the static subject even when program is empty", async () => {
    const result = await renderEmail(leadNotificationEmail, makeLeadProps({ program: "" }));

    expect(result.subject).toBe("New program lead");
    expect(result.html.length).toBeGreaterThan(0);
  });

  it("includes the program and contact in the html", async () => {
    const result = await renderEmail(
      leadNotificationEmail,
      makeLeadProps({ program: "12-Week Strength Block", contact: "alex@example.com" }),
    );

    expect(result.html).toContain("12-Week Strength Block");
    expect(result.html).toContain("alex@example.com");
  });

  it("greets with 'Hi,' when recipient name is null", async () => {
    const result = await renderEmail(leadNotificationEmail, makeLeadProps({ recipientName: null }));

    expect(result.html).toContain("Hi,");
  });

  it("escapes script, img, and attribute-break payloads in program, contact, and message", async () => {
    const result = await renderEmail(
      leadNotificationEmail,
      makeLeadProps({
        program: IMG_PAYLOAD,
        contact: '"><b>bold</b>',
        message: SCRIPT_PAYLOAD,
      }),
    );

    expect(result.html).not.toContain(SCRIPT_PAYLOAD);
    expect(result.html).not.toContain(RAW_IMG_TAG);
    expect(result.html).not.toContain("<img");
    expect(result.html).not.toContain("<b>bold</b>");
    expect(result.html).toContain(ESCAPED_SCRIPT);
    expect(result.html).toContain(ESCAPED_IMG);
  });

  it("escapes a script payload injected through the program preview preheader", async () => {
    const result = await renderEmail(
      leadNotificationEmail,
      makeLeadProps({ program: SCRIPT_PAYLOAD }),
    );

    expect(result.html).not.toContain(SCRIPT_PAYLOAD);
    expect(result.html).toContain(ESCAPED_SCRIPT);
  });
});

describe("email source safety", () => {
  it("never uses dangerouslySetInnerHTML in components or templates", () => {
    const sourceFiles = [
      "./components/email-layout.tsx",
      "./components/email-button.tsx",
      "./components/link-fallback.tsx",
      "./components/info-row.tsx",
      "./templates/invitation.tsx",
      "./templates/password-reset.tsx",
      "./templates/lead-notification.tsx",
      "./render.tsx",
    ];

    for (const relativePath of sourceFiles) {
      const absolutePath = fileURLToPath(new URL(relativePath, import.meta.url));
      const contents = readFileSync(absolutePath, "utf8");

      expect(contents).not.toContain("dangerouslySetInnerHTML");
    }
  });
});
