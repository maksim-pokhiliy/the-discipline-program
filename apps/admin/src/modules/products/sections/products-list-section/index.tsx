"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import { Chip, IconButton, Stack, Switch, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type Product } from "@repo/contracts/cms/product";
import { useDeleteConfirmation } from "@repo/query";
import { formatPrice } from "@repo/shared";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteProduct, useToggleProductFeatured, useToggleProductStatus } from "@app/lib/hooks";

const getDisplayPrice = (product: Product): string => {
  const activePrice = product.prices.find((p) => p.isActive);

  if (!activePrice) {
    return "No price";
  }

  return formatPrice(activePrice.amountCents, activePrice.currency);
};

const filters: DataTableFilter<Product>[] = [
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
  products: Product[];
};

export const ProductsListSection = ({ products }: ProductsListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const toggleStatusMutation = useToggleProductStatus();
  const toggleFeaturedMutation = useToggleProductFeatured();
  const deleteMutation = useDeleteProduct();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        id: "title",
        label: "Product Name",
        width: "35%",
        sortable: true,
        sortValue: (product) => product.title,
        searchValue: (product) => product.title,
        render: (product) => (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" component="span">
              {product.title}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              /{product.slug}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "isActive",
        label: "Status",
        width: "20%",
        render: (product) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch
              size="small"
              checked={product.isActive}
              disabled={
                toggleStatusMutation.isPending && toggleStatusMutation.variables === product.id
              }
              onChange={() => toggleStatusMutation.mutate(product.id)}
              color="success"
            />

            <Chip
              label={product.isActive ? "Active" : "Inactive"}
              color={product.isActive ? "success" : "default"}
              size="small"
              variant="outlined"
            />
          </Stack>
        ),
      },
      {
        id: "featured",
        label: "Spotlight",
        width: "20%",
        render: (product) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch
              size="small"
              checked={product.isFeatured}
              disabled={
                toggleFeaturedMutation.isPending && toggleFeaturedMutation.variables === product.id
              }
              onChange={() => toggleFeaturedMutation.mutate(product.id)}
              color="warning"
            />

            <Chip
              icon={product.isFeatured ? <StarIcon fontSize="small" /> : undefined}
              label={product.isFeatured ? "Featured" : "Standard"}
              color={product.isFeatured ? "warning" : "default"}
              size="small"
              variant="outlined"
            />
          </Stack>
        ),
      },
      {
        id: "price",
        label: "Price",
        width: "15%",
        render: (product) => <Typography variant="body2">{getDisplayPrice(product)}</Typography>,
      },
      {
        id: "features",
        label: "Features",
        width: "15%",
        render: (product) => (
          <Chip label={`${product.features.length} items`} size="small" variant="outlined" />
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "15%",
        render: (product) => (
          <Stack direction="row" spacing={0} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton component={Link} href={`/products/${product.id}`} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton color="error" onClick={() => requestDelete(product.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [toggleStatusMutation, toggleFeaturedMutation, requestDelete],
  );

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
