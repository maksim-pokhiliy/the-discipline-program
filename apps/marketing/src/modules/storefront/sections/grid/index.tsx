"use client";

import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

import { type Product, type StorefrontProgramsPageData } from "@repo/contracts";
import { ContentSection } from "@repo/ui";

import { StorefrontProgramCard } from "../card";
import { StorefrontProgramModal } from "../modal";

interface ProgramsGridSectionProps {
  productsList: StorefrontProgramsPageData["productsList"];
}

export const StorefrontProgramsGridSection = ({ productsList }: ProgramsGridSectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const programSlug = searchParams.get("program");

    if (programSlug) {
      const product = productsList.find((p) => p.slug === programSlug);

      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [searchParams, productsList]);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    router.push(`/storefront?program=${product.slug}`, { scroll: false });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    router.push("/storefront", { scroll: false });
  };

  return (
    <ContentSection>
      <Grid container spacing={4}>
        {productsList.map((product) => (
          <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <StorefrontProgramCard product={product} onLearnMore={() => handleOpenModal(product)} />
          </Grid>
        ))}
      </Grid>

      <StorefrontProgramModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onClose={handleCloseModal}
      />
    </ContentSection>
  );
};
