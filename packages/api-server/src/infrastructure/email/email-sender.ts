import {
  createResendEmailService,
  type EmailPort,
  type EmailTemplate,
  renderEmail,
} from "@repo/email";
import { emailEnv } from "@repo/env/email";
import { InternalServerError } from "@repo/errors";
import { logger } from "@repo/shared";

export type ResolvedEmailConfig = {
  apiKey: string;
  from: { email: string };
  replyTo?: { email: string };
};

export function resolveEmailConfig(options: { required: true }): ResolvedEmailConfig;
export function resolveEmailConfig(options: { required: false }): ResolvedEmailConfig | null;
export function resolveEmailConfig(options: { required: boolean }): ResolvedEmailConfig | null {
  const apiKey = emailEnv.RESEND_API_KEY;
  const fromAddress = emailEnv.EMAIL_FROM;

  if (!apiKey || !fromAddress) {
    if (options.required) {
      throw new InternalServerError("RESEND_API_KEY or EMAIL_FROM missing");
    }

    return null;
  }

  const replyToAddress = emailEnv.EMAIL_REPLY_TO;

  return {
    apiKey,
    from: { email: fromAddress },
    ...(replyToAddress && { replyTo: { email: replyToAddress } }),
  };
}

let cachedService: EmailPort | null = null;
let cachedApiKey: string | null = null;

const getEmailService = (config: ResolvedEmailConfig): EmailPort => {
  if (cachedService && cachedApiKey === config.apiKey) {
    return cachedService;
  }

  cachedService = createResendEmailService({
    apiKey: config.apiKey,
    defaultFrom: config.from,
    ...(config.replyTo && { defaultReplyTo: config.replyTo }),
  });
  cachedApiKey = config.apiKey;

  return cachedService;
};

type SendTransactionalEmailInput<P> = {
  template: EmailTemplate<P>;
  props: P;
  to: { email: string };
  required: boolean;
  logKey: string;
  logCtx: Record<string, string>;
};

export const sendTransactionalEmail = async <P>(
  input: SendTransactionalEmailInput<P>,
): Promise<void> => {
  const config = input.required
    ? resolveEmailConfig({ required: true })
    : resolveEmailConfig({ required: false });

  if (config === null) {
    logger.warn(`${input.logKey}_config_missing`, input.logCtx);

    return;
  }

  const { subject, html, text } = await renderEmail(input.template, input.props);
  const service = getEmailService(config);

  try {
    await service.send({
      from: config.from,
      to: input.to,
      subject,
      html,
      text,
      ...(config.replyTo && { replyTo: config.replyTo }),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";

    logger.error(`${input.logKey}_send_failed`, { ...input.logCtx, reason });
  }
};
