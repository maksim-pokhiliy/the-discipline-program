"use client";

import { type AdminProductListItem } from "@repo/contracts/cms/product";
import { useDeleteConfirmation } from "@repo/query";
import { ConfirmationModal, DataTable, useDataTableUrlState, type DataTableFilter } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteProduct } from "@app/lib/hooks";

import { useProductColumns } from "./use-product-columns";

const filters: DataTableFilter<AdminProductListItem>[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
    match: (item, value) => (value === "active" ? item.isActive : !item.isActive),
  },
  {
    id: "spotlight",
    label: "Spotlight",
    options: [
      { label: "Featured", value: "featured" },
      { label: "Standard", value: "standard" },
    ],
    match: (item, value) => (value === "featured" ? item.isFeatured : !item.isFeatured),
  },
];

type ProductsListSectionProps = {
  products: AdminProductListItem[];
};

export const ProductsListSection = ({ products }: ProductsListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteProduct();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns = useProductColumns(requestDelete);

  return (
    <>
      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search products..."
        filters={filters}
        action={<CreateButton href="/products/create">Create Product</CreateButton>}
        paginated
        emptyMessage="No products found. Start by creating one!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Product"
        onClose={cancelDelete}
        type="danger"
        message="Are you sure you want to delete this product?"
        details="This will remove the product from the storefront immediately. This action cannot be undone."
        confirmText="Delete"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
      />
    </>
  );
};
