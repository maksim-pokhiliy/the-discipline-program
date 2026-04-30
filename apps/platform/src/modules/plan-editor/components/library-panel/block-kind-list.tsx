"use client";

import { Stack, Typography } from "@mui/material";

import { useBlockKindsPageData } from "@app/lib/hooks";

import { LibraryListItem } from "./library-list-item";

type BlockKindListProps = {
  search: string;
  currentUserId: string;
};

export const BlockKindList = ({ search, currentUserId }: BlockKindListProps) => {
  const { data, isLoading } = useBlockKindsPageData(
    { search: search.length > 0 ? search : undefined },
    currentUserId,
  );

  if (isLoading) {
    return (
      <Typography variant="caption" color="text.secondary">
        Loading...
      </Typography>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No block kinds
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <LibraryListItem
          key={item.id}
          draggableId={`block-kind:${item.id}`}
          payload={{
            kind: "block-kind",
            blockKindId: item.id,
            defaultWeight: item.defaultWeight,
          }}
          name={item.name}
          scope={item.scope}
        />
      ))}
    </Stack>
  );
};
