import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";

import { type FaqPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface FaqSectionProps {
  content: FaqPageData["content"];
}

export const FaqSection = ({ content }: FaqSectionProps) => {
  return (
    <ContentSection title={content.title} maxWidth="md" offset={1}>
      <Stack>
        {content.items.map((item, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {item.question}
              </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="body1" color="text.secondary">
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </ContentSection>
  );
};
