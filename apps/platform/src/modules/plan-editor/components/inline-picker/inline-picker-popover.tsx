"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  ClickAwayListener,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popper,
  Typography,
} from "@mui/material";

import { filterPickerOptions } from "@repo/ui";

export type InlinePickerOption = {
  id: string;
  label: string;
  description?: string | undefined;
  group?: string | undefined;
};

export type InlinePickerPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  query: string;
  options: InlinePickerOption[];
  loading?: boolean;
  emptyLabel?: string;
  onSelect: (option: InlinePickerOption) => void;
  onClose: () => void;
};

export const filterInlinePickerOptions = (
  options: InlinePickerOption[],
  query: string,
): InlinePickerOption[] => filterPickerOptions(options, query);

export const InlinePickerPopover = ({
  open,
  anchorEl,
  query,
  options,
  loading = false,
  emptyLabel = "No results",
  onSelect,
  onClose,
}: InlinePickerPopoverProps) => {
  const visibleOptions = useMemo(() => filterInlinePickerOptions(options, query), [options, query]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);
  const visibleOptionsRef = useRef(visibleOptions);
  const onSelectRef = useRef(onSelect);
  const onCloseRef = useRef(onClose);

  visibleOptionsRef.current = visibleOptions;
  onSelectRef.current = onSelect;
  onCloseRef.current = onClose;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, options]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const total = visibleOptionsRef.current.length;

          if (total === 0) {
            return 0;
          }

          return (prev + 1) % total;
        });

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const total = visibleOptionsRef.current.length;

          if (total === 0) {
            return 0;
          }

          return (prev - 1 + total) % total;
        });

        return;
      }

      if (event.key === "Enter") {
        const choice = visibleOptionsRef.current[activeIndex];

        if (choice) {
          event.preventDefault();
          onSelectRef.current(choice);
        }

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handler, true);

    return () => {
      window.removeEventListener("keydown", handler, true);
    };
  }, [open, activeIndex]);

  if (!open || !anchorEl) {
    return null;
  }

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Box
          sx={{
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            boxShadow: 4,
            width: 320,
            maxHeight: 320,
            overflowY: "auto",
          }}
          role="listbox"
        >
          {loading ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          ) : visibleOptions.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {emptyLabel}
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding ref={listRef}>
              {visibleOptions.map((option, index) => (
                <ListItem key={option.id} disablePadding>
                  <ListItemButton
                    selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => onSelect(option)}
                  >
                    <ListItemText
                      primary={option.label}
                      secondary={option.group ?? option.description}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </ClickAwayListener>
    </Popper>
  );
};
