"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useProductsPageData } from "@app/lib/hooks";

import { ProductsListSection } from "../../sections";

export const ProductsListView = () => (
  <AdminListView
    queryResult={useProductsPageData()}
    loadingMessage="Loading products..."
    title="Products"
    subtitle="Manage your storefront catalog — pricing, features, and availability"
  >
    {(data) => <ProductsListSection products={data.products} />}
  </AdminListView>
);
