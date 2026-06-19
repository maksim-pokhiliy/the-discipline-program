import { render } from "@react-email/render";

import { type RenderedEmail } from "./invitation.render";
import { LeadNotificationEmail, type LeadNotificationEmailProps } from "./lead-notification";

export const renderLeadNotificationEmail = async (
  props: LeadNotificationEmailProps,
): Promise<RenderedEmail> => {
  const element = LeadNotificationEmail(props);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return { html, text };
};
