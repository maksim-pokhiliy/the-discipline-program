import { EmailLayout } from "../src/components/email-layout";
import { invitationEmail, type InvitationEmailProps } from "../src/templates/invitation";

const exampleProps: InvitationEmailProps = {
  inviteUrl: "https://app.thedisciplineprogram.com/invite/example-token-123",
  recipientName: "Alex",
  expiresInHours: 48,
};

const InvitationPreview = () => (
  <EmailLayout preview={invitationEmail.preview(exampleProps)}>
    {invitationEmail.Body(exampleProps)}
  </EmailLayout>
);

export default InvitationPreview;
