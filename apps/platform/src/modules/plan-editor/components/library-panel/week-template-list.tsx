"use client";

import { Stack, Typography } from "@mui/material";

import { useWeekTemplatesPageData } from "@app/lib/hooks";

import { DraggableTemplateListItem } from "./draggable-template-list-item";

type WeekTemplateListProps = {
  search: string;
  currentUserId: string;
};

export const WeekTemplateList = ({ search, currentUserId }: WeekTemplateListProps) => {
  const { data, isLoading } = useWeekTemplatesPageData(
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
        No week templates
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <DraggableTemplateListItem
          key={item.id}
          templateId={item.id}
          kind="week"
          name={item.name}
          description={item.description}
          scope={item.scope}
        />
      ))}
    </Stack>
  );
};
