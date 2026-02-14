"use client";

import { useState } from "react";

import { Stack } from "@mui/material";

import { type AdminProductsPageData } from "@repo/contracts/product";
import { QueryWrapper } from "@repo/query";

import { useProductsPageData } from "@app/lib/hooks";

import { ProductsListSection, ProductsStatsSection } from "../../sections";

interface ProductsListViewProps {
  initialData: AdminProductsPageData;
}

export const ProductsListView = ({ initialData }: ProductsListViewProps) => {
  const { data, isLoading, error } = useProductsPageData({ initialData });
  const [filter, setFilter] = useState<string | null>(null);

  const handleFilterChange = (key: string) => {
    setFilter((prev) => (prev === key ? null : key));
  };

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading products..."
    >
      {(data) => (
        <Stack spacing={0}>
          <ProductsStatsSection
            stats={data.stats}
            selectedFilter={filter}
            onFilterChange={handleFilterChange}
          />
          <ProductsListSection products={data.products} filter={filter} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
