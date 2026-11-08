"use client";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type AdminPageDetails } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { useIsPageSectionSaving, useUpdatePageSection } from "@app/lib/hooks";

import { LanguageBar } from "../../components/language-bar";
import { type EditorLocale } from "../../components/locale-gate";
import { getSectionEditorKey, SectionEditor } from "../../components/section-editor";
import { pagesListHref } from "../../config/locale-url";
import { PAGE_LABELS } from "../../config/page-labels";

type PagesEditFormProps = {
  page: AdminPageDetails;
  locale: EditorLocale;
};

export const PagesEditForm: React.FC<PagesEditFormProps> = ({ page, locale }) => {
  const { mutate: updateSection } = useUpdatePageSection(page.slug, locale.code);
  const isSaving = useIsPageSectionSaving(page.slug, locale.code);
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
      backHref={pagesListHref(locale.code)}
      backLabel="Back to Pages"
      maxWidth="xl"
      textAlign="left"
      animated={false}
    >
      <Stack spacing={2}>
        <LanguageBar locale={locale} />
        {page.sections.map((section) => (
          <SectionEditor
            key={getSectionEditorKey(section, locale.code)}
            section={section}
            locale={locale}
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
