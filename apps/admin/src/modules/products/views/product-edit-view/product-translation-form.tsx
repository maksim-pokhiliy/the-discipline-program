"use client";

import { type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Grid, Stack } from "@mui/material";
import { useIsMutating } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { TranslationState } from "@repo/contracts/cms/locale";
import {
  type AdminProductDetails,
  type AdminProductTranslation,
  type ProductTranslationWords,
  productTranslationWordsSchema,
} from "@repo/contracts/cms/product";
import { FormView } from "@repo/ui";

import { adminKeys } from "@app/lib/api/keys";
import { EditorLanguageBar } from "@app/lib/components/localized-editor/editor-language-bar";
import { fieldsetStyles } from "@app/lib/components/localized-editor/fieldset-styles";
import { type EditorLocale } from "@app/lib/components/localized-editor/locale-gate";
import { SectionFieldContext } from "@app/lib/components/localized-editor/section-field";
import { TranslationSeedRefresh } from "@app/lib/components/localized-editor/translation-refresh";
import { useSaveProductTranslation } from "@app/lib/hooks";

import { ProductLanguageBanner } from "../../components";
import { PRODUCT_FIELD_KINDS } from "../../config";

import { ProductSharedCard } from "./product-shared-card";
import { ProductTranslationActions } from "./product-translation-actions";
import { ProductTranslationFields } from "./product-translation-fields";

type ProductTranslationFormProps = {
  product: AdminProductDetails;
  translation: AdminProductTranslation;
  locale: EditorLocale;
};

export const ProductTranslationForm = ({
  product,
  translation,
  locale,
}: ProductTranslationFormProps): ReactElement => {
  const { mutate: save, isPending: isSaving } = useSaveProductTranslation(product.id, locale.code);
  const isPending =
    useIsMutating({
      mutationKey: adminKeys.products.translationSave(product.id, locale.code),
    }) > 0 || isSaving;
  const seed = translation.words;
  const methods = useForm<ProductTranslationWords>({
    resolver: zodResolver(productTranslationWordsSchema),
    defaultValues: seed,
  });
  const canSave = methods.formState.isDirty || translation.state === TranslationState.ENGLISH_NEWER;
  const handleClear = (): void => {
    methods.reset(seed, { keepFieldsRef: true });
    save({ title: "", description: "", features: [] });
  };

  return (
    <FormView
      methods={methods}
      onSubmit={save}
      isPending={isPending}
      isSubmitHidden
      title="Edit Product"
      subtitle={product.title}
      backHref="/products"
      backLabel="Back to List"
    >
      <SectionFieldContext.Provider value={{ kinds: PRODUCT_FIELD_KINDS, english: product }}>
        <TranslationSeedRefresh kinds={PRODUCT_FIELD_KINDS} seed={seed} />
        <EditorLanguageBar locale={locale}>
          <ProductLanguageBanner locale={locale} />
        </EditorLanguageBar>
        <Stack component="fieldset" disabled={isPending} spacing={3} sx={fieldsetStyles}>
          {translation.state === TranslationState.ENGLISH_NEWER && (
            <Alert severity="info">
              English changed after this translation was saved. Check the words against the English,
              then click Save Translation to confirm them.
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <ProductTranslationFields state={translation.state} />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <ProductSharedCard product={product} />
            </Grid>
          </Grid>
          <ProductTranslationActions
            languageName={locale.name}
            state={translation.state}
            isDisabled={isPending}
            canSave={canSave}
            onSave={methods.handleSubmit((words) => save(words))}
            onClear={handleClear}
          />
        </Stack>
      </SectionFieldContext.Provider>
    </FormView>
  );
};
