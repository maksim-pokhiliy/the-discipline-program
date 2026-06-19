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

export type PasswordResetEmailProps = {
  resetUrl: string;
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

export const PasswordResetEmail = ({
  resetUrl,
  recipientName,
  expiresInHours,
}: PasswordResetEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";

  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading>Reset your password</Heading>
          <Section>
            <Text>{greeting}</Text>
            <Text>
              We received a request to reset the password for your account. Click the link below to
              choose a new password.
            </Text>
            <Text>
              <Link href={resetUrl} style={linkStyle}>
                {resetUrl}
              </Link>
            </Text>
            <Hr />
            <Text>
              This link expires in {expiresInHours} hour(s). If you didn&apos;t request a password
              reset, you can safely ignore this email — your password will not change.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
