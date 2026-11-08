import { type ReactElement } from "react";

import { Alert } from "@mui/material";

import { type AdminPageSection, SectionTranslationState } from "@repo/contracts/cms/pages";

type SectionNoticesProps = { section: Pick<AdminPageSection, "hasUnreadableData" | "translation"> };

export const SectionNotices = ({ section }: SectionNoticesProps): ReactElement => (
  <>
    {section.hasUnreadableData && (
      <Alert severity="warning">
        The saved content of this section could not be read and is not shown on the site. Saving the
        form replaces it.
      </Alert>
    )}
    {section.translation?.state === SectionTranslationState.ENGLISH_NEWER && (
      <Alert severity="info">
        English changed after this translation was saved. Check the words against the English, then
        click Update Section to confirm them.
      </Alert>
    )}
  </>
);
