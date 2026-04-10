import { Box, Stack, Typography } from "@mui/material";

import { type AboutPageData } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { SplitSection } from "@app/lib/components/ui";

type AboutPersonalSectionProps = {
  personal: AboutPageData["personal"];
};

export const AboutPersonalSection = ({ personal }: AboutPersonalSectionProps) => {
  return (
    <ContentSection id="personal" title={personal.title} subtitle={personal.subtitle}>
      <SplitSection backgroundImage={personal.image}>
        <Stack spacing={4} justifyContent="center" sx={{ height: "100%" }}>
          <Typography variant="h3Italic">&quot;{personal.description}&quot;</Typography>

          <Box>
            <Typography variant="h2">{personal.name}</Typography>

            <Typography variant="h3" color="primary">
              {personal.role}
            </Typography>
          </Box>
        </Stack>
      </SplitSection>
    </ContentSection>
  );
};
