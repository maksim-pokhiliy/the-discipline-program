"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { Box, List, ListItemButton, ListItemText, Paper, Typography } from "@mui/material";

import type { SlashCommandItem } from "../runtime/slash-items-types";

export type SlashMenuHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export type SlashMenuProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (props.items.length === 0) {
        return false;
      }

      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev - 1 + props.items.length) % props.items.length);

        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % props.items.length);

        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);

        return true;
      }

      return false;
    },
  }));

  return (
    <Paper elevation={6} sx={{ width: 280, maxHeight: 320, overflow: "auto" }}>
      {props.items.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No matches
          </Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {props.items.map((item, index) => (
            <ListItemButton
              key={item.id}
              selected={index === selectedIndex}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{ variant: "body2" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
});

SlashMenu.displayName = "SlashMenu";
