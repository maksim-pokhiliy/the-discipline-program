import { Link, Section, Text } from "@react-email/components";

import { theme } from "../theme";

type LinkFallbackProps = {
  url: string;
};

export const LinkFallback = ({ url }: LinkFallbackProps) => (
  <Section style={theme.linkFallback}>
    <Text style={theme.mutedText}>Or copy this link:</Text>
    <Link href={url} style={theme.link}>
      {url}
    </Link>
  </Section>
);
