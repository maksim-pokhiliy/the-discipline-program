export type EmailAddress = {
  email: string;
  name?: string;
};

export type SendEmailInput = {
  from: EmailAddress;
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailAddress;
};

export type SendEmailResult = {
  id: string;
};

export type EmailPort = {
  send(input: SendEmailInput): Promise<SendEmailResult>;
};
