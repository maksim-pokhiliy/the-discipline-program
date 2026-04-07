import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";

import { type FaqPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface FaqSectionProps {
  content: FaqPageData["content"];
}

export const FaqSection = ({ content }: FaqSectionProps) => {
  return (
    <ContentSection id="faq-content" title={content.title} subtitle={content.subtitle}>
      <Stack>
        {content.items.map((item) => (
          <Accordion key={item.question} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h3">{item.question}</Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="h5" color="text.secondary">
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </ContentSection>
  );
};
