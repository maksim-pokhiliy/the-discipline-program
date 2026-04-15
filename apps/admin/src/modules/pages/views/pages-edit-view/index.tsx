"use client";

import { Suspense } from "react";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type AdminPageDetails, type UpdatePageSectionData } from "@repo/contracts/cms/pages";
import { capitalize } from "@repo/shared";
import { ContentSection, QueryWrapper } from "@repo/ui";

import { usePageDetails, useUpdatePageSection } from "@app/lib/hooks";

import { SectionEditor } from "../../components/section-editor";

type PagesEditFormProps = {
  page: AdminPageDetails;
};

const PagesEditForm: React.FC<PagesEditFormProps> = ({ page }) => {
  const { mutate: updateSection, isPending } = useUpdatePageSection();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultSection = page.sections[0]?.section ?? false;
  const expanded: string | false = searchParams.get("section") ?? defaultSection;

  const handleToggle = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    const params = new URLSearchParams(searchParams.toString());

    if (isExpanded) {
      params.set("section", panel);
    } else {
      params.delete("section");
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  const onSaveSection = (
    pageSlug: string,
    sectionName: UpdatePageSectionData["section"],
    data: UpdatePageSectionData["data"],
  ) => {
    updateSection({
      slug: pageSlug,
      data: {
        section: sectionName,
        data,
      },
    });
  };

  return (
    <ContentSection
      title="Edit Marketing Page"
      subtitle={capitalize(page.slug)}
      backHref="/pages"
      backLabel="Back to Pages"
      maxWidth="xl"
      textAlign="left"
      animated={false}
    >
      <Stack spacing={2}>
        {page.sections.map((section) => (
          <SectionEditor
            key={section.id}
            section={section}
            isExpanded={expanded === section.section}
            onToggle={handleToggle(section.section)}
            onSave={(formData) => onSaveSection(page.slug, section.section, formData)}
            isLoading={isPending}
          />
        ))}
      </Stack>
    </ContentSection>
  );
};

type PagesEditViewProps = {
  slug: string;
};

export const PagesEditView: React.FC<PagesEditViewProps> = ({ slug }) => {
  const { data, isLoading, error } = usePageDetails(slug);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading page...">
      {(page) => (
        <Suspense>
          <PagesEditForm page={page} />
        </Suspense>
      )}
    </QueryWrapper>
  );
};
