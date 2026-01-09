import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";

import { type ContactPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

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
              sx={(theme) => ({
                "& .MuiAccordionSummary-content": {
                  margin: theme.spacing(4, 0),
                },

                "&.Mui-expanded": {
                  minHeight: "auto",
                },
              })}
            >
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
