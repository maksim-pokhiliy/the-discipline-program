import { type ReactElement } from "react";

import { Alert } from "@mui/material";

import { FormCard } from "@app/lib/components/form-card";

import { LanguageCodeField } from "./language-code-field";
import { LanguageNameField } from "./language-name-field";

type LanguageCreateFormProps = { isPending: boolean };

export const LanguageCreateForm = ({ isPending }: LanguageCreateFormProps): ReactElement => (
  <FormCard title="Basic info">
    <LanguageCodeField isPending={isPending} />
    <LanguageNameField isPending={isPending} />
    <Alert severity="info">
      A new language starts hidden from the site. Translate it, then enable it from the list.
    </Alert>
  </FormCard>
);
