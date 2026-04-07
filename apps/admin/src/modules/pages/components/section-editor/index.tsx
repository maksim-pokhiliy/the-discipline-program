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
} from "@repo/contracts/pages";

import { SECTION_FEATURES, type HeroSectionType } from "../../config/section-features";
import { ContactSectionForm } from "../sections/contact-section-form";
import { CredentialsSectionForm } from "../sections/credentials-section-form";
import { FaqSectionForm } from "../sections/faq-section-form";
import { HeroSectionForm } from "../sections/hero-section-form";
import { JourneySectionForm } from "../sections/journey-section-form";
import { PersonalSectionForm } from "../sections/personal-section-form";
import { ReviewsSectionForm } from "../sections/reviews-section-form";
import { StorefrontSectionForm } from "../sections/storefront-section-form";
import { WhyChooseSectionForm } from "../sections/why-choose-section-form";

const SECTION_LABELS: Record<SectionSchemaKey, string> = {
  hero: "Hero",
  "about:hero": "About Hero",
  "contact:hero": "Contact Hero",
  "blog:hero": "Blog Hero",
  "storefront:hero": "Storefront Hero",
  "faq:hero": "FAQ Hero",
  whyChoose: "Why Choose Us",
  storefront: "Storefront",
  "storefront:grid": "Storefront Grid",
  "storefront:cta": "Storefront CTA",
  "blog:grid": "Blog Grid",
  "contact:form": "Contact Form",
  reviews: "Reviews",
  contact: "Contact",
  cta: "Call to Action",
  "faq:cta": "FAQ CTA",
  journey: "Journey",
  credentials: "Credentials",
  personal: "Personal",
  "faq:content": "FAQ Content",
};

const isSectionSchemaKey = (key: string): key is SectionSchemaKey => key in SECTION_SCHEMAS;

const isHeroSectionType = (key: string): key is HeroSectionType => key in SECTION_FEATURES;

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
  const currentSchema = isSectionSchemaKey(section.section)
    ? SECTION_SCHEMAS[section.section]
    : undefined;

  const parsedData = currentSchema?.safeParse(section.data);
  const safeDefaultValues = parsedData?.success ? parsedData.data : {};

  const methods = useForm<UpdatePageSectionData["data"]>({
    defaultValues: safeDefaultValues,
    resolver: currentSchema ? zodResolver(currentSchema) : undefined,
    mode: "onChange",
  });

  const renderForm = () => {
    switch (section.section) {
      case "hero":
      case "about:hero":
      case "contact:hero":
      case "blog:hero":
      case "storefront:hero":
      case "faq:hero": {
        if (!isHeroSectionType(section.section)) {
          return null;
        }

        return <HeroSectionForm sectionType={section.section} />;
      }

      case "whyChoose": {
        return <WhyChooseSectionForm />;
      }

      case "storefront":
      case "storefront:grid":
      case "blog:grid":
      case "contact:form": {
        return <StorefrontSectionForm />;
      }

      case "reviews": {
        return <ReviewsSectionForm />;
      }

      case "contact":
      case "storefront:cta":
      case "cta":
      case "faq:cta": {
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

      case "faq:content": {
        return <FaqSectionForm />;
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
        <Typography variant="subtitle1">
          {isSectionSchemaKey(section.section) ? SECTION_LABELS[section.section] : section.section}
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
