"use client";

import { Button, Grid, Stack } from "@mui/material";
import Link from "next/link";

import { type HomePageData } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { ProductCard, ProductModal } from "@app/lib/components/ui";
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
              freeLabel={programs.freeLabel}
              onAction={() => modal.open(product)}
              actionLabel={programs.cardActionLabel}
            />
          </Grid>
        ))}
      </Grid>

      <Stack alignItems="center" sx={{ mt: 10 }}>
        <Button component={Link} href={programs.buttonHref} size="large">
          {programs.buttonText}
        </Button>
      </Stack>

      <ProductModal
        product={modal.selectedProduct}
        freeLabel={programs.freeLabel}
        dismissLabel={programs.modalDismissLabel}
        actionLabel={programs.modalActionLabel}
        open={modal.isOpen}
        onClose={modal.close}
      />
    </ContentSection>
  );
};
