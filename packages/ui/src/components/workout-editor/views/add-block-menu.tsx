"use client";

import { useCallback, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Menu, MenuItem, Stack, Typography } from "@mui/material";

import type { AddBlockSlashItem } from "../runtime/slash-items-types";

export type AddBlockMenuProps = {
  items: ReadonlyArray<AddBlockSlashItem>;
  disabled: boolean;
  onSelect: (item: AddBlockSlashItem) => void;
};

export const AddBlockMenu = ({ items, disabled, onSelect }: AddBlockMenuProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchor(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchor(null);
  }, []);

  const handleSelect = useCallback(
    (item: AddBlockSlashItem) => {
      onSelect(item);
      setAnchor(null);
    },
    [onSelect],
  );

  return (
    <>
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        disabled={disabled}
        aria-label="Add block"
      >
        Add block
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={handleClose}>
        {items.map((item) => (
          <MenuItem key={item.id} onClick={() => handleSelect(item)}>
            <Stack>
              <Typography variant="body2">{item.label}</Typography>
              {item.description !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  {item.description}
                </Typography>
              )}
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
