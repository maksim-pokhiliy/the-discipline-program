export type { EmailAddress, EmailPort, SendEmailInput, SendEmailResult } from "@repo/email";

export {
  resolveEmailConfig,
  type ResolvedEmailConfig,
  sendTransactionalEmail,
} from "./email-sender";
