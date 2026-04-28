"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import { useCommandPaletteActions, useCommandPaletteState } from "./command-palette.context";
import { useFilteredCommands } from "./use-command-palette";

export const CommandPalette = () => {
  const { open } = useCommandPaletteState();
  const { setOpen } = useCommandPaletteActions();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = useFilteredCommands(query);
  const filteredRef = useRef(filtered);
  const inputRef = useRef<HTMLInputElement | null>(null);

  filteredRef.current = filtered;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const total = filteredRef.current.length;

          return total === 0 ? 0 : (prev + 1) % total;
        });

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const total = filteredRef.current.length;

          return total === 0 ? 0 : (prev - 1 + total) % total;
        });

        return;
      }

      if (event.key === "Enter") {
        const choice = filteredRef.current[activeIndex];

        if (choice) {
          event.preventDefault();
          close();
          await choice.perform();
        }
      }
    },
    [activeIndex, close],
  );

  const groupedCounts = useMemo(() => {
    const map = new Map<string, number>();

    for (const command of filtered) {
      const group = command.group ?? "General";

      map.set(group, (map.get(group) ?? 0) + 1);
    }

    return map;
  }, [filtered]);

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }} onKeyDown={handleKeyDown}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <TextField
            inputRef={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command..."
            fullWidth
            size="small"
            autoFocus
            inputProps={{ "aria-label": "Command palette input" }}
          />
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No commands match your query
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
            {filtered.map((command, index) => (
              <ListItem key={command.id} disablePadding>
                <ListItemButton
                  selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={async () => {
                    close();
                    await command.perform();
                  }}
                  data-testid={`command-${command.id}`}
                >
                  <ListItemText
                    primary={command.title}
                    secondary={
                      command.hint
                        ? `${command.group ?? "General"} · ${command.hint}`
                        : (command.group ?? "General")
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        <Box
          sx={{ px: 2, py: 1, borderTop: 1, borderColor: "divider", bgcolor: "background.default" }}
        >
          <Typography variant="caption" color="text.secondary">
            {Array.from(groupedCounts.entries())
              .map(([group, count]) => `${group}: ${count.toString()}`)
              .join(" · ") || "0 commands"}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
