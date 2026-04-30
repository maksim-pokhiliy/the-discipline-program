"use client";

import { Stack, Typography } from "@mui/material";

import { useSchemeTemplatesPageData } from "@app/lib/hooks";

import { LibraryListItem } from "./library-list-item";

type SchemeTemplateListProps = {
  search: string;
  currentUserId: string;
};

export const SchemeTemplateList = ({ search, currentUserId }: SchemeTemplateListProps) => {
  const { data, isLoading } = useSchemeTemplatesPageData(
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
        No schemes
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <LibraryListItem
          key={item.id}
          draggableId={`scheme-template:${item.id}`}
          payload={{
            kind: "scheme-template",
            schemeTemplateId: item.id,
            archetypeKind: item.archetypeKind,
            defaultParams: item.defaultParams,
          }}
          name={item.name}
          scope={item.scope}
        />
      ))}
    </Stack>
  );
};
