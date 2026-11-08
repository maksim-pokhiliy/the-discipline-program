"use client";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { type AdminPageDetails } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { useIsPageSectionSaving, useUpdatePageSection } from "@app/lib/hooks";

import { getSectionEditorKey, SectionEditor } from "../../components/section-editor";
import { PAGE_LABELS } from "../../config/page-labels";

type PagesEditFormProps = {
  page: AdminPageDetails;
};

export const PagesEditForm: React.FC<PagesEditFormProps> = ({ page }) => {
  const { mutate: updateSection } = useUpdatePageSection(page.slug, DEFAULT_LOCALE_CODE);
  const isSaving = useIsPageSectionSaving(page.slug, DEFAULT_LOCALE_CODE);
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

  return (
    <ContentSection
      title="Edit Marketing Page"
      subtitle={PAGE_LABELS[page.slug]}
      backHref="/pages"
      backLabel="Back to Pages"
      maxWidth="xl"
      textAlign="left"
      animated={false}
    >
      <Stack spacing={2}>
        {page.sections.map((section) => (
          <SectionEditor
            key={getSectionEditorKey(section)}
            section={section}
            isExpanded={expanded === section.section}
            onToggle={handleToggle(section.section)}
            onSave={(body) => updateSection(body)}
            isLoading={isSaving}
          />
        ))}
      </Stack>
    </ContentSection>
  );
};
