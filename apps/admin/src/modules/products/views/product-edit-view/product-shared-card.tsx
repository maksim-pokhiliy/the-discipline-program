import { type ReactElement } from "react";

import { TextField } from "@mui/material";

import { type AdminProduct } from "@repo/contracts/cms/product";

import { FormCard } from "@app/lib/components/form-card";
import { SHARED_FIELD_HELPER } from "@app/lib/components/localized-editor/section-field";

import { getDisplayPrice, ProductThumbnail } from "../../components";

type ProductSharedCardProps = { product: AdminProduct };

export const ProductSharedCard = ({ product }: ProductSharedCardProps): ReactElement => (
  <FormCard title="Shared with English" subtitle={SHARED_FIELD_HELPER}>
    <ProductThumbnail title={product.title} imageUrl={product.imageUrl} isPreview />
    {[
      { label: "URL Slug", value: product.slug },
      { label: "Price", value: getDisplayPrice(product) },
      { label: "Status", value: product.isActive ? "Active" : "Inactive" },
      { label: "Spotlight", value: product.isFeatured ? "Featured" : "Standard" },
    ].map(({ label, value }) => (
      <TextField
        key={label}
        label={label}
        value={value}
        slotProps={{ input: { readOnly: true } }}
      />
    ))}
  </FormCard>
);
