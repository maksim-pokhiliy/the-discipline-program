"use client";

import { type ReactNode, useState } from "react";

import { Button, Collapse, Stack } from "@mui/material";

export type CollapsibleListProps = {
  items: ReactNode[];
  initialCount?: number;
  spacing?: number;
  container?: React.ComponentType<{ children: React.ReactNode }>;
};

export const CollapsibleList = ({
  items,
  initialCount = 3,
  spacing = 2,
  container: Container,
}: CollapsibleListProps) => {
  const [showAll, setShowAll] = useState(false);

  const visible = items.slice(0, initialCount);
  const hidden = items.slice(initialCount);

  const content = (
    <>
      <Stack spacing={spacing}>{visible}</Stack>

      {hidden.length > 0 && (
        <Collapse in={showAll}>
          <Stack spacing={spacing}>{hidden}</Stack>
        </Collapse>
      )}
    </>
  );

  return (
    <Stack spacing={spacing}>
      {Container ? <Container>{content}</Container> : content}

      {hidden.length > 0 && (
        <Button onClick={() => setShowAll((prev) => !prev)}>
          {showAll ? "Show less" : `Show ${hidden.length} more`}
        </Button>
      )}
    </Stack>
  );
};
