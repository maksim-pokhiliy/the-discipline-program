import { Heading, Section, Text } from "@react-email/components";

import { EmailButton } from "../components/email-button";
import { LinkFallback } from "../components/link-fallback";
import { defineEmail } from "../render";
import { greet, theme } from "../theme";

export type InvitationEmailProps = {
  inviteUrl: string;
  recipientName?: string | null;
  expiresInHours: number;
};

export const invitationEmail = defineEmail<InvitationEmailProps>({
  subject: () => "You've been invited",
  preview: () => "You've been invited — set your password to get started",
  Body: ({ inviteUrl, recipientName, expiresInHours }) => (
    <Section>
      <Heading style={theme.heading}>You&apos;ve been invited</Heading>
      <Text style={theme.text}>{greet(recipientName)}</Text>
      <Text style={theme.text}>
        You&apos;ve been invited to join The Discipline Program. Use the button below to set your
        password and activate your account.
      </Text>
      <EmailButton href={inviteUrl}>Set your password</EmailButton>
      <LinkFallback url={inviteUrl} />
      <Text style={theme.mutedText}>
        This invitation link expires in {expiresInHours} hours. If you did not expect this email,
        you can safely ignore it.
      </Text>
    </Section>
  ),
});
