import { Heading, Section, Text } from "@react-email/components";

import { EmailButton } from "../components/email-button";
import { LinkFallback } from "../components/link-fallback";
import { defineEmail } from "../render";
import { greet, theme } from "../theme";

export type PasswordResetEmailProps = {
  resetUrl: string;
  recipientName?: string | null;
  expiresInHours: number;
};

export const passwordResetEmail = defineEmail<PasswordResetEmailProps>({
  subject: () => "Reset your password",
  preview: () => "Reset your password",
  Body: ({ resetUrl, recipientName, expiresInHours }) => (
    <Section>
      <Heading style={theme.heading}>Reset your password</Heading>
      <Text style={theme.text}>{greet(recipientName)}</Text>
      <Text style={theme.text}>
        We received a request to reset the password for your account. Use the button below to choose
        a new password.
      </Text>
      <EmailButton href={resetUrl}>Choose a new password</EmailButton>
      <LinkFallback url={resetUrl} />
      <Text style={theme.mutedText}>
        This link expires in {expiresInHours} hour(s). If you didn&apos;t request a password reset,
        you can safely ignore this email — your password will not change.
      </Text>
    </Section>
  ),
});
