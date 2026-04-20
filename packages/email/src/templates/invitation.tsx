import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type InvitationEmailProps = {
  inviteUrl: string;
  recipientName?: string | null;
  expiresInHours: number;
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

const linkStyle = {
  color: "#2563eb",
  wordBreak: "break-all" as const,
};

export const InvitationEmail = ({
  inviteUrl,
  recipientName,
  expiresInHours,
}: InvitationEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";

  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited — set your password to get started</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading>You&apos;ve been invited</Heading>
          <Section>
            <Text>{greeting}</Text>
            <Text>
              An administrator has invited you to join The Discipline Program. Click the link below
              to set your password and activate your account.
            </Text>
            <Text>
              <Link href={inviteUrl} style={linkStyle}>
                {inviteUrl}
              </Link>
            </Text>
            <Hr />
            <Text>
              This invitation link expires in {expiresInHours} hours. If you did not expect this
              email, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
