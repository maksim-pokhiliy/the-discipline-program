"use client";

import { Grid } from "@mui/material";

import { type StorefrontProgramsPageData } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { LeadFormModal, ProductCard, ProductModal } from "@app/lib/components/ui";
import { useProductModal } from "@app/lib/hooks";

type StorefrontProgramsGridSectionProps = {
  grid: NonNullable<StorefrontProgramsPageData["grid"]>;
  productsList: StorefrontProgramsPageData["productsList"];
};

export const StorefrontProgramsGridSection = ({
  grid,
  productsList,
}: StorefrontProgramsGridSectionProps) => {
  const modal = useProductModal({ products: productsList, basePath: "/storefront" });

  return (
    <ContentSection id="programs" title={grid.title} subtitle={grid.subtitle}>
      <Grid container spacing={4}>
        {productsList.map((product) => (
          <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ProductCard
              product={product}
              freeLabel={grid.freeLabel ?? "Free"}
              onAction={() => modal.open(product)}
              cardVariant="outlined"
            />
          </Grid>
        ))}
      </Grid>

      <ProductModal
        product={modal.selectedProduct}
        freeLabel={grid.freeLabel ?? "Free"}
        dismissLabel={grid.modalDismissLabel ?? "Close"}
        actionLabel={grid.modalActionLabel ?? "Get started"}
        open={modal.isOpen}
        onClose={modal.close}
        onGetStarted={() => {
          modal.close();

          if (modal.selectedProduct) {
            modal.openLead(modal.selectedProduct);
          }
        }}
      />

      <LeadFormModal
        product={modal.leadProduct}
        open={modal.isLeadOpen}
        onClose={modal.closeLead}
      />
    </ContentSection>
  );
};
