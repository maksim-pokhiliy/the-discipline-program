"use client";

import { Grid } from "@mui/material";

import { type StorefrontProgramsPageData } from "@repo/contracts";
import { ContentSection } from "@repo/ui";

import { useProductModal } from "@app/lib/hooks";
import { ProductCard, ProductModal } from "@app/shared/components/ui";

interface ProgramsGridSectionProps {
  hero: StorefrontProgramsPageData["hero"];
  productsList: StorefrontProgramsPageData["productsList"];
}

export const StorefrontProgramsGridSection = ({ hero, productsList }: ProgramsGridSectionProps) => {
  const modal = useProductModal({ products: productsList, basePath: "/storefront" });

  return (
    <ContentSection title={hero.title} subtitle={hero.subtitle} offset={1}>
      <Grid container spacing={4}>
        {productsList.map((product) => (
          <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ProductCard
              product={product}
              onAction={() => modal.open(product)}
              cardVariant="outlined"
            />
          </Grid>
        ))}
      </Grid>

      <ProductModal product={modal.selectedProduct} open={modal.isOpen} onClose={modal.close} />
    </ContentSection>
  );
};
