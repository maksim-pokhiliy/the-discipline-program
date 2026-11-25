"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import { Chip, IconButton, Stack, Switch, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type AdminProductListItem } from "@repo/contracts/cms/product";
import { type Column } from "@repo/ui";

import { useToggleProductFeatured, useToggleProductStatus } from "@app/lib/hooks";

import { getDisplayPrice, ProductThumbnail } from "../../components";

import { ProductLanguagesCell } from "./product-languages-cell";

const PHOTO_COLUMN: Column<AdminProductListItem> = {
  id: "photo",
  label: "Photo",
  width: "8%",
  render: (product) => <ProductThumbnail title={product.title} imageUrl={product.imageUrl} />,
};
const NAME_COLUMN: Column<AdminProductListItem> = {
  id: "title",
  label: "Product Name",
  width: "22%",
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
};
const PRICE_COLUMN: Column<AdminProductListItem> = {
  id: "price",
  label: "Price",
  width: "11%",
  render: (product) => <Typography variant="body2">{getDisplayPrice(product)}</Typography>,
};
const FEATURES_COLUMN: Column<AdminProductListItem> = {
  id: "features",
  label: "Features",
  width: "8%",
  render: (product) => (
    <Chip label={`${product.features.length} items`} size="small" variant="outlined" />
  ),
};
const LANGUAGES_COLUMN: Column<AdminProductListItem> = {
  id: "languages",
  label: "Languages",
  width: "14%",
  render: (product) => <ProductLanguagesCell translations={product.translations} />,
};

const statusColumn = (
  mutation: ReturnType<typeof useToggleProductStatus>,
): Column<AdminProductListItem> => ({
  id: "isActive",
  label: "Status",
  width: "13%",
  render: (product) => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Switch
        size="small"
        checked={product.isActive}
        disabled={mutation.isPending && mutation.variables === product.id}
        onChange={() => mutation.mutate(product.id)}
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
});

const featuredColumn = (
  mutation: ReturnType<typeof useToggleProductFeatured>,
): Column<AdminProductListItem> => ({
  id: "featured",
  label: "Spotlight",
  width: "14%",
  render: (product) => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Switch
        size="small"
        checked={product.isFeatured}
        disabled={mutation.isPending && mutation.variables === product.id}
        onChange={() => mutation.mutate(product.id)}
        color="warning"
      />
      <Chip
        {...(product.isFeatured && { icon: <StarIcon fontSize="small" /> })}
        label={product.isFeatured ? "Featured" : "Standard"}
        color={product.isFeatured ? "warning" : "default"}
        size="small"
        variant="outlined"
      />
    </Stack>
  ),
});

const actionsColumn = (onDelete: (id: string) => void): Column<AdminProductListItem> => ({
  id: "actions",
  label: "Actions",
  align: "right",
  width: "10%",
  render: (product) => (
    <Stack direction="row" spacing={0} justifyContent="flex-end">
      <Tooltip title="Edit">
        <IconButton
          component={Link}
          href={`/products/${product.id}`}
          color="primary"
          aria-label="Edit"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton color="error" onClick={() => onDelete(product.id)} aria-label="Delete">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  ),
});

export const useProductColumns = (
  onDelete: (id: string) => void,
): Column<AdminProductListItem>[] => {
  const status = useToggleProductStatus();
  const featured = useToggleProductFeatured();

  return useMemo(
    () => [
      PHOTO_COLUMN,
      NAME_COLUMN,
      statusColumn(status),
      featuredColumn(featured),
      PRICE_COLUMN,
      FEATURES_COLUMN,
      LANGUAGES_COLUMN,
      actionsColumn(onDelete),
    ],
    [status, featured, onDelete],
  );
};
