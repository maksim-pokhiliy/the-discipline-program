import { render } from "@react-email/render";

import { type RenderedEmail } from "./invitation.render";
import { PasswordResetEmail, type PasswordResetEmailProps } from "./password-reset";

export const renderPasswordResetEmail = async (
  props: PasswordResetEmailProps,
): Promise<RenderedEmail> => {
  const element = PasswordResetEmail(props);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return { html, text };
};
