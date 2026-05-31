import { Resend } from "resend";

import {
  type EmailAddress,
  type EmailPort,
  type SendEmailInput,
  type SendEmailResult,
} from "./port";

export type ResendEmailServiceConfig = {
  apiKey: string;
  defaultFrom?: EmailAddress;
  defaultReplyTo?: EmailAddress;
};

const EMAIL_TIMEOUT_MS = 10_000;

const formatAddress = (address: EmailAddress): string =>
  address.name ? `${address.name} <${address.email}>` : address.email;

const formatRecipients = (to: EmailAddress | EmailAddress[]): string | string[] =>
  Array.isArray(to) ? to.map(formatAddress) : formatAddress(to);

const withTimeout = async <T>(operation: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Resend send timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createResendEmailService = (config: ResendEmailServiceConfig): EmailPort => {
  const client = new Resend(config.apiKey);

  return {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      const from = input.from ?? config.defaultFrom;

      if (!from) {
        throw new Error("createResendEmailService: missing `from` address");
      }

      const replyTo = input.replyTo ?? config.defaultReplyTo;

      const response = await withTimeout(
        client.emails.send({
          from: formatAddress(from),
          to: formatRecipients(input.to),
          subject: input.subject,
          html: input.html,
          ...(input.text !== undefined && { text: input.text }),
          ...(replyTo && { replyTo: formatAddress(replyTo) }),
        }),
        EMAIL_TIMEOUT_MS,
      );

      if (response.error || !response.data) {
        const reason = response.error?.message ?? "unknown error";

        throw new Error(`Resend send failed: ${reason}`);
      }

      return { id: response.data.id };
    },
  };
};
