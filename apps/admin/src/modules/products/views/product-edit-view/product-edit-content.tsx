"use client";

import { type ReactElement } from "react";

import { QueryWrapper } from "@repo/ui";

import { type EditorLocale } from "@app/lib/components/localized-editor/locale-gate";
import { useProduct } from "@app/lib/hooks";

import { ProductEditForm } from "./product-edit-form";
import { ProductTranslationForm } from "./product-translation-form";

type ProductEditContentProps = { id: string; locale: EditorLocale };

export const ProductEditContent = ({ id, locale }: ProductEditContentProps): ReactElement => {
  const { data, isLoading, error } = useProduct(id, locale.code);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={data ? null : error}
      data={data}
      loadingMessage="Loading product..."
    >
      {(product) =>
        locale.isDefault ? (
          <ProductEditForm product={product} locale={locale} />
        ) : product.translation ? (
          <ProductTranslationForm
            key={locale.code}
            product={product}
            translation={product.translation}
            locale={locale}
          />
        ) : null
      }
    </QueryWrapper>
  );
};
