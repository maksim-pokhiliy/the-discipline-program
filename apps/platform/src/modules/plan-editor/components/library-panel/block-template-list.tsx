"use client";

import { Stack, Typography } from "@mui/material";

import { useBlockTemplatesPageData } from "@app/lib/hooks";

import { DraggableTemplateListItem } from "./draggable-template-list-item";

type BlockTemplateListProps = {
  search: string;
  currentUserId: string;
};

export const BlockTemplateList = ({ search, currentUserId }: BlockTemplateListProps) => {
  const { data, isLoading } = useBlockTemplatesPageData(
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
        No block templates
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <DraggableTemplateListItem
          key={item.id}
          templateId={item.id}
          kind="block"
          name={item.name}
          description={item.description}
          scope={item.scope}
        />
      ))}
    </Stack>
  );
};
