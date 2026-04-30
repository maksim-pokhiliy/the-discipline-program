"use client";

import { Stack, Typography } from "@mui/material";

import { useSessionTemplatesPageData } from "@app/lib/hooks";

import { DraggableTemplateListItem } from "./draggable-template-list-item";

type SessionTemplateListProps = {
  search: string;
  currentUserId: string;
};

export const SessionTemplateList = ({ search, currentUserId }: SessionTemplateListProps) => {
  const { data, isLoading } = useSessionTemplatesPageData(
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
        No session templates
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <DraggableTemplateListItem
          key={item.id}
          templateId={item.id}
          kind="session"
          name={item.name}
          description={item.description}
          scope={item.scope}
        />
      ))}
    </Stack>
  );
};
