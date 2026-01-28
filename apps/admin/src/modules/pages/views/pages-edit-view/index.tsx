"use client";

import { useState } from "react";

import { Stack } from "@mui/material";

import {
  type AdminPageDetails,
  updatePageSectionSchema,
  type UpdatePageSectionData,
} from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";
import { ContentSection } from "@repo/ui";

import { usePageDetails, useUpdatePageSection } from "@app/lib/hooks";

import { SectionEditor } from "../../components/section-editor";

interface PagesEditViewProps {
  initialData: AdminPageDetails;
}

export const PagesEditView = ({ initialData }: PagesEditViewProps) => {
  const { data, isLoading, error } = usePageDetails(initialData.slug, { initialData });
  const { mutate: updateSection, isPending } = useUpdatePageSection();

  const [expanded, setExpanded] = useState<string | false>(
    initialData.sections[0]?.section || false,
  );

  const handleToggle = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const onSaveSection = (
    pageSlug: string,
    sectionName: UpdatePageSectionData["section"],
    data: UpdatePageSectionData["data"],
  ) => {
    const validated = updatePageSectionSchema.parse({
      pageSlug,
      section: sectionName,
      data,
    });

    updateSection({
      slug: pageSlug,
      data: {
        section: validated.section,
        data: validated.data,
      },
    });
  };

  return (
    <ContentSection
      title="Edit Marketing Page"
      subtitle={initialData.slug.toUpperCase()}
      backHref="/pages"
      backLabel="Back to Pages"
      backgroundColor="dark"
    >
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={data}
        loadingMessage="Loading page details..."
      >
        {(page) => (
          <Stack spacing={2}>
            {page.sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                isExpanded={expanded === section.section}
                onToggle={handleToggle(section.section)}
                onSave={(formData) =>
                  onSaveSection(
                    page.slug,
                    section.section as UpdatePageSectionData["section"],
                    formData as UpdatePageSectionData["data"],
                  )
                }
                isLoading={isPending}
              />
            ))}
          </Stack>
        )}
      </QueryWrapper>
    </ContentSection>
  );
};
