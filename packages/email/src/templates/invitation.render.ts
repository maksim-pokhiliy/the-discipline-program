import { render } from "@react-email/render";

import { InvitationEmail, type InvitationEmailProps } from "./invitation";

export type RenderedEmail = {
  html: string;
  text: string;
};

export const renderInvitationEmail = async (
  props: InvitationEmailProps,
): Promise<RenderedEmail> => {
  const element = InvitationEmail(props);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return { html, text };
};
