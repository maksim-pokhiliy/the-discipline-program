import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { Grid } from "@mui/material";

import { type AboutPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { FeatureCard } from "@app/lib/components/ui";

type AboutCredentialsSectionProps = {
  credentials: AboutPageData["credentials"];
};

export const AboutCredentialsSection = ({ credentials }: AboutCredentialsSectionProps) => {
  return (
    <ContentSection
      id="credentials"
      title={credentials.title}
      subtitle={credentials.subtitle}
      surface="raised"
    >
      <Grid container spacing={6}>
        {credentials.items.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={VerifiedOutlinedIcon}
              title={item.title}
              description={item.description}
            />
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
