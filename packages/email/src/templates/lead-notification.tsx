import { Heading, Hr, Section, Text } from "@react-email/components";

import { InfoRow } from "../components/info-row";
import { defineEmail } from "../render";
import { greet, theme } from "../theme";

export type LeadNotificationEmailProps = {
  program: string;
  contact: string;
  message?: string | null;
  recipientName?: string | null;
};

export const leadNotificationEmail = defineEmail<LeadNotificationEmailProps>({
  subject: () => "New program lead",
  preview: ({ program }) => `New program lead — a visitor is interested in ${program}`,
  Body: ({ program, contact, message, recipientName }) => (
    <Section>
      <Heading style={theme.heading}>New program lead</Heading>
      <Text style={theme.text}>{greet(recipientName)}</Text>
      <Text style={theme.text}>
        A visitor submitted interest through the marketing site. Reach out to follow up.
      </Text>
      <InfoRow label="Program" value={program} />
      <InfoRow label="Contact" value={contact} />
      {message ? (
        <>
          <Hr style={theme.hr} />
          <InfoRow label="Message" value={message} />
        </>
      ) : null}
    </Section>
  ),
});
