"use client";

import { Button, Grid, Stack } from "@mui/material";
import Link from "next/link";

import { type HomePageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { useProductModal } from "@app/lib/hooks";
import { ProductCard, ProductModal } from "@app/shared/components/ui";

interface HomeProgramsPreviewProps {
  programs: HomePageData["storefront"];
  productsList: HomePageData["productsList"];
}

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
              onAction={() => modal.open(product)}
              actionLabel="Get Started"
            />
          </Grid>
        ))}
      </Grid>

      <Stack alignItems="center" sx={{ mt: 10 }}>
        <Button component={Link} href="/storefront#programs" size="large">
          View All Programs
        </Button>
      </Stack>

      <ProductModal product={modal.selectedProduct} open={modal.isOpen} onClose={modal.close} />
    </ContentSection>
  );
};
