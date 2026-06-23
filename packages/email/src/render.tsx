import { type ReactElement } from "react";

import { render } from "@react-email/render";

import { EmailLayout } from "./components/email-layout";

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export type EmailTemplate<P> = {
  subject: (props: P) => string;
  preview: (props: P) => string;
  Body: (props: P) => ReactElement;
};

export const defineEmail = <P,>(template: EmailTemplate<P>): EmailTemplate<P> => template;

export const renderEmail = async <P,>(
  template: EmailTemplate<P>,
  props: P,
): Promise<RenderedEmail> => {
  const element = (
    <EmailLayout preview={template.preview(props)}>{template.Body(props)}</EmailLayout>
  );

  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return { subject: template.subject(props), html, text };
};
