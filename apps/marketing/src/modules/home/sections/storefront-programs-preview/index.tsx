"use client";

import { Button, Grid, Stack } from "@mui/material";
import Link from "next/link";

import { type HomePageData } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { LeadFormModal, ProductCard, ProductModal } from "@app/lib/components/ui";
import { useProductModal } from "@app/lib/hooks";

type HomeProgramsPreviewProps = {
  programs: NonNullable<HomePageData["storefront"]>;
  productsList: HomePageData["productsList"];
};

export const HomeStorefrontProgramsPreview = ({
  programs,
  productsList,
}: HomeProgramsPreviewProps) => {
  const previewProducts = productsList.slice(0, 3);
  const modal = useProductModal({ products: previewProducts, basePath: "/" });

  return (
    <ContentSection
      id="programs-preview"
      title={programs.title}
      subtitle={programs.subtitle}
      surface="raised"
    >
      <Grid container spacing={4} sx={{ alignItems: "stretch" }}>
        {previewProducts.map((product) => (
          <Grid key={product.id} size={{ xs: 12, md: 4 }}>
            <ProductCard
              product={product}
              freeLabel={programs.freeLabel ?? "Free"}
              onAction={() => modal.open(product)}
              actionLabel={programs.cardActionLabel ?? "Learn more"}
            />
          </Grid>
        ))}
      </Grid>

      <Stack alignItems="center" sx={{ mt: 10 }}>
        {programs.buttonHref !== undefined && programs.buttonText !== undefined && (
          <Button component={Link} href={programs.buttonHref} size="large">
            {programs.buttonText}
          </Button>
        )}
      </Stack>

      <ProductModal
        product={modal.selectedProduct}
        freeLabel={programs.freeLabel ?? "Free"}
        dismissLabel={programs.modalDismissLabel ?? "Close"}
        actionLabel={programs.modalActionLabel ?? "Get started"}
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
