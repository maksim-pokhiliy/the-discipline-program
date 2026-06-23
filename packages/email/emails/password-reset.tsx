import { EmailLayout } from "../src/components/email-layout";
import { passwordResetEmail, type PasswordResetEmailProps } from "../src/templates/password-reset";

const exampleProps: PasswordResetEmailProps = {
  resetUrl: "https://app.thedisciplineprogram.com/reset-password/example-token-123",
  recipientName: "Alex",
  expiresInHours: 1,
};

const PasswordResetPreview = () => (
  <EmailLayout preview={passwordResetEmail.preview(exampleProps)}>
    {passwordResetEmail.Body(exampleProps)}
  </EmailLayout>
);

export default PasswordResetPreview;
