"use client";

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

import { type AdminPageDetails, type UpdatePageSectionData } from "@repo/contracts/pages";

import { HeroSectionForm } from "../sections/hero-section-form";

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
  const methods = useForm<UpdatePageSectionData["data"]>({
    defaultValues: section.data as UpdatePageSectionData["data"],
  });

  const isHero = section.section.includes("hero");

  if (!isHero) {
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
            <HeroSectionForm />

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={methods.handleSubmit(onSave)}
                disabled={isLoading || !methods.formState.isDirty}
              >
                {isLoading ? "Loading..." : "Update Section"}
              </Button>
            </Stack>
          </Stack>
        </FormProvider>
      </AccordionDetails>
    </Accordion>
  );
};
