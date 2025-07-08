import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Typography, Accordion, AccordionSummary, AccordionDetails, Stack } from "@mui/material";
import { ContactPageData } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui/content-section";

interface ContactFAQProps {
  faq: ContactPageData["faq"];
}

export const ContactFAQ = ({ faq }: ContactFAQProps) => {
  return (
    <ContentSection title={faq.title} maxWidth="md">
      <Stack spacing={2}>
        {faq.items.map((item, index) => (
          <Accordion
            key={index}
            sx={{
              "&:before": {
                display: "none",
              },
              "&.Mui-expanded": {
                margin: 0,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                "& .MuiAccordionSummary-content": {
                  margin: "16px 0",
                },
                "&.Mui-expanded": {
                  minHeight: "auto",
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {item.question}
              </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </ContentSection>
  );
};
