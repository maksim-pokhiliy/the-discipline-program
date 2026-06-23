import { EmailLayout } from "../src/components/email-layout";
import {
  leadNotificationEmail,
  type LeadNotificationEmailProps,
} from "../src/templates/lead-notification";

const exampleProps: LeadNotificationEmailProps = {
  program: "12-Week Strength Block",
  contact: "alex@example.com",
  message: "Looking to start next month — is there room?",
  recipientName: "Coach",
};

const LeadNotificationPreview = () => (
  <EmailLayout preview={leadNotificationEmail.preview(exampleProps)}>
    {leadNotificationEmail.Body(exampleProps)}
  </EmailLayout>
);

export default LeadNotificationPreview;
