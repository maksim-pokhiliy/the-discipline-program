"use client";

import { Suspense } from "react";

import { LocaleGate } from "@app/lib/components/localized-editor/locale-gate";

import { ProductEditContent } from "./product-edit-content";

type ProductEditViewProps = {
  id: string;
};

export const ProductEditView: React.FC<ProductEditViewProps> = ({ id }) => (
  <Suspense>
    <LocaleGate>{(locale) => <ProductEditContent id={id} locale={locale} />}</LocaleGate>
  </Suspense>
);
