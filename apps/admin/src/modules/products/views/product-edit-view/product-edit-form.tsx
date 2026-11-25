"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { PRODUCT_PRICE_DEFAULTS, type AdminProductDetails } from "@repo/contracts/cms/product";
import { centsToAmount } from "@repo/shared";
import { FormView } from "@repo/ui";

import { EditorLanguageBar } from "@app/lib/components/localized-editor/editor-language-bar";
import {
  DEFAULT_EDITOR_LOCALE,
  type EditorLocale,
} from "@app/lib/components/localized-editor/locale-gate";
import { IMAGE_MUTATION_KEY, useUpdateProduct } from "@app/lib/hooks";

import {
  ProductForm,
  ProductLanguageBanner,
  productFormSchema,
  toProductApiData,
  type ProductFormData,
} from "../../components";

type ProductFormInput = z.input<typeof productFormSchema>;

type ProductEditFormProps = {
  product: AdminProductDetails;
  locale?: EditorLocale;
};

export const ProductEditForm: React.FC<ProductEditFormProps> = ({
  product,
  locale = DEFAULT_EDITOR_LOCALE,
}) => {
  const { mutate: updateProduct, isPending: isSaving } = useUpdateProduct();
  const isImageBusy = useIsMutating({ mutationKey: IMAGE_MUTATION_KEY }) > 0;
  const isPending = isSaving || isImageBusy;

  const activePrice = product.prices.find((p) => p.isActive);

  const methods = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: product.title,
      slug: product.slug,
      description: product.description || "",
      features: product.features,
      imageUrl: product.imageUrl,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      price: activePrice
        ? {
            amount: centsToAmount(activePrice.amountCents),
            currency: activePrice.currency,
            periodCount: activePrice.periodCount,
            periodUnit: activePrice.periodUnit,
            autoRenew: activePrice.autoRenew,
          }
        : { ...PRODUCT_PRICE_DEFAULTS },
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateProduct({ id: product.id, data: toProductApiData(data) })}
      isPending={isPending}
      title="Edit Product"
      subtitle={product.title}
      backHref="/products"
      backLabel="Back to List"
    >
      <EditorLanguageBar locale={locale}>
        <ProductLanguageBanner locale={locale} />
      </EditorLanguageBar>
      <ProductForm isLoading={isPending} disableAutoSlug={true} />
    </FormView>
  );
};
