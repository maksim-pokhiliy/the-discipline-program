import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type LeadNotificationEmailProps = {
  program: string;
  contact: string;
  message?: string | null;
  recipientName?: string | null;
};

const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px 24px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const labelStyle = {
  color: "#6b7280",
  fontWeight: "bold" as const,
};

export const LeadNotificationEmail = ({
  program,
  contact,
  message,
  recipientName,
}: LeadNotificationEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";

  return (
    <Html>
      <Head />
      <Preview>New program lead — a visitor is interested in {program}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading>New program lead</Heading>
          <Section>
            <Text>{greeting}</Text>
            <Text>
              A visitor submitted interest through the marketing site. Reach out to follow up.
            </Text>
            <Text>
              <span style={labelStyle}>Program:</span> {program}
            </Text>
            <Text>
              <span style={labelStyle}>Contact:</span> {contact}
            </Text>
            {message ? (
              <>
                <Hr />
                <Text>
                  <span style={labelStyle}>Message:</span> {message}
                </Text>
              </>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
