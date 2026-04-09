"use client";

import { Grid } from "@mui/material";

import { type StorefrontProgramsPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { ProductCard, ProductModal } from "@app/lib/components/ui";
import { useProductModal } from "@app/lib/hooks";

type ProgramsGridSectionProps = {
  grid: StorefrontProgramsPageData["grid"];
  productsList: StorefrontProgramsPageData["productsList"];
};

export const StorefrontProgramsGridSection = ({ grid, productsList }: ProgramsGridSectionProps) => {
  const modal = useProductModal({ products: productsList, basePath: "/storefront" });

  return (
    <ContentSection id="programs" title={grid.title} subtitle={grid.subtitle}>
      <Grid container spacing={4}>
        {productsList.map((product) => (
          <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ProductCard
              product={product}
              freeLabel={grid.freeLabel}
              onAction={() => modal.open(product)}
              cardVariant="outlined"
            />
          </Grid>
        ))}
      </Grid>

      <ProductModal
        product={modal.selectedProduct}
        freeLabel={grid.freeLabel}
        dismissLabel={grid.modalDismissLabel}
        actionLabel={grid.modalActionLabel}
        open={modal.isOpen}
        onClose={modal.close}
      />
    </ContentSection>
  );
};
