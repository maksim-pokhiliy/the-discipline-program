"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";

import {
  SECTION_SCHEMAS,
  type AdminPageDetails,
  type SectionSchemaKey,
  type UpdatePageSectionData,
  type HeroSectionType,
} from "@repo/contracts/pages";

import { ContactSectionForm } from "../sections/contact-section-form";
import { CredentialsSectionForm } from "../sections/credentials-section-form";
import { HeroSectionForm } from "../sections/hero-section-form";
import { JourneySectionForm } from "../sections/journey-section-form";
import { PersonalSectionForm } from "../sections/personal-section-form";
import { ReviewsSectionForm } from "../sections/reviews-section-form";
import { StorefrontSectionForm } from "../sections/storefront-section-form";
import { WhyChooseSectionForm } from "../sections/why-choose-section-form";

type SectionData = AdminPageDetails["sections"][number];

interface SectionEditorProps {
  section: SectionData;
  isExpanded: boolean;
  onToggle: (event: React.SyntheticEvent, isExpanded: boolean) => void;
  onSave: (data: UpdatePageSectionData["data"]) => void;
  isLoading: boolean;
}

export const SectionEditor = ({
  section,
  isExpanded,
  onToggle,
  onSave,
  isLoading,
}: SectionEditorProps) => {
  const currentSchema = SECTION_SCHEMAS[section.section as SectionSchemaKey];

  const methods = useForm<UpdatePageSectionData["data"]>({
    defaultValues: section.data as UpdatePageSectionData["data"],
    resolver: currentSchema ? zodResolver(currentSchema) : undefined,
    mode: "onChange",
  });

  const renderForm = () => {
    switch (section.section) {
      case "hero":
      case "about:hero":
      case "contact:hero":
      case "blog:hero":
      case "storefront:hero": {
        return <HeroSectionForm sectionType={section.section as HeroSectionType} />;
      }

      case "whyChoose": {
        return <WhyChooseSectionForm />;
      }

      case "storefront": {
        return <StorefrontSectionForm />;
      }

      case "reviews": {
        return <ReviewsSectionForm />;
      }

      case "contact":
      case "storefront:cta":
      case "cta": {
        return <ContactSectionForm />;
      }

      case "journey": {
        return <JourneySectionForm />;
      }

      case "credentials": {
        return <CredentialsSectionForm />;
      }

      case "personal": {
        return <PersonalSectionForm />;
      }

      default: {
        return null;
      }
    }
  };

  const formContent = renderForm();

  if (!formContent) {
    return null;
  }

  return (
    <Accordion expanded={isExpanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {section.section.toUpperCase()}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <FormProvider {...methods}>
          <Stack spacing={3}>
            {formContent}

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={methods.handleSubmit(onSave)}
                disabled={isLoading || !methods.formState.isDirty}
              >
                Update Section
              </Button>
            </Stack>
          </Stack>
        </FormProvider>
      </AccordionDetails>
    </Accordion>
  );
};
