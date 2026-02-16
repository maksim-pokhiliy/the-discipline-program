"use client";

import { type AdminProductsPageData } from "@repo/contracts/product";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useProductsPageData } from "@app/lib/hooks";

import { ProductsListSection } from "../../sections";

interface ProductsListViewProps {
  initialData: AdminProductsPageData;
}

export const ProductsListView = ({ initialData }: ProductsListViewProps) => (
  <AdminListView
    queryResult={useProductsPageData({ initialData })}
    loadingMessage="Loading products..."
  >
    {(data) => <ProductsListSection products={data.products} />}
  </AdminListView>
);
