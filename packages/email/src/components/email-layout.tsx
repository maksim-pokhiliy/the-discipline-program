import { type ReactNode } from "react";

import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { emailFontStack, theme } from "../theme";

const WORDMARK = "THE DISCIPLINE PROGRAM";
const FOOTER_TEXT = "The Discipline Program · This is an automated message.";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => (
  <Html>
    <Head>
      <Font fontFamily="-apple-system" fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]} />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={{ ...theme.body, fontFamily: emailFontStack }}>
      <Container style={theme.container}>
        <Hr style={theme.accentBar} />
        <Section style={theme.header}>
          <Text style={theme.wordmark}>{WORDMARK}</Text>
        </Section>
        {children}
        <Hr style={theme.hr} />
        <Text style={theme.footer}>{FOOTER_TEXT}</Text>
      </Container>
    </Body>
  </Html>
);
