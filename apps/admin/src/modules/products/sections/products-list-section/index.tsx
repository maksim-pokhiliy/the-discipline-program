"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button, Chip, IconButton, Stack, Switch, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type Product } from "@repo/contracts/product";
import { formatPrice } from "@repo/shared";
import { ConfirmationModal, DataTable, type Column, PanelSection } from "@repo/ui";

import { useDeleteProduct, useToggleProductStatus } from "@app/lib/hooks";

interface ProductsListSectionProps {
  products: Product[];
  filter?: string | null;
}

export const ProductsListSection = ({ products, filter }: ProductsListSectionProps) => {
  const filteredProducts = filter
    ? products.filter((product) => {
        if (filter === "active") {
          return product.isActive;
        }

        if (filter === "inactive") {
          return !product.isActive;
        }

        return true;
      })
    : products;

  const { mutateAsync: toggleStatus } = useToggleProductStatus();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string) => {
    setLoadingId(id);

    try {
      await toggleStatus(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete, {
        onSuccess: () => setProductToDelete(null),
      });
    }
  };

  const getDisplayPrice = (product: Product): string => {
    const activePrice = product.prices.find((p) => p.isActive);

    if (!activePrice) {
      return "No price";
    }

    return formatPrice(activePrice.amountCents, activePrice.currency);
  };

  const columns: Column<Product>[] = [
    {
      id: "title",
      label: "Product Name",
      width: "35%",
      render: (product) => (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" component="span" fontWeight={600}>
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
            disabled={loadingId === product.id}
            onChange={() => handleToggleStatus(product.id)}
            color="success"
          />

          <Chip
            label={product.isActive ? "Active" : "Inactive"}
            color={product.isActive ? "success" : "default"}
            size="small"
            variant="outlined"
            sx={{ minWidth: 80, justifyContent: "center" }}
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
            <IconButton
              component={Link}
              href={`/products/${product.id}`}
              size="small"
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setProductToDelete(product.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PanelSection
        title="Products"
        action={
          <Button
            component={Link}
            href="/products/create"
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
          >
            Create Product
          </Button>
        }
      >
        <DataTable
          data={filteredProducts}
          columns={columns}
          emptyMessage="No products found. Start by creating one!"
        />
      </PanelSection>

      <ConfirmationModal
        open={!!productToDelete}
        title="Delete Product"
        onClose={() => setProductToDelete(null)}
        type="danger"
        message="Are you sure you want to delete this product?"
        details="This will remove the product from the storefront immediately. This action cannot be undone."
        confirmText="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
