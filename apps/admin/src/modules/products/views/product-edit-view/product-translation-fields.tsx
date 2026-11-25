import { type ReactElement } from "react";

import { Stack } from "@mui/material";

import { type TranslationState } from "@repo/contracts/cms/locale";
import { type ProductTranslationWords } from "@repo/contracts/cms/product";

import { FormCard } from "@app/lib/components/form-card";
import { SectionTextField } from "@app/lib/components/localized-editor/section-field";
import { TranslationStateChip } from "@app/lib/components/localized-editor/translation-state";

import { ProductFeaturesCard } from "../../components";

type ProductTranslationFieldsProps = { state: TranslationState };

export const ProductTranslationFields = ({
  state,
}: ProductTranslationFieldsProps): ReactElement => (
  <Stack spacing={3}>
    <FormCard title="Product Details" action={<TranslationStateChip state={state} />}>
      <Stack spacing={3}>
        <SectionTextField<ProductTranslationWords> name="title" label="Product Title" />
        <SectionTextField<ProductTranslationWords>
          name="description"
          label="Description"
          minRows={6}
        />
      </Stack>
    </FormCard>
    <ProductFeaturesCard />
  </Stack>
);
