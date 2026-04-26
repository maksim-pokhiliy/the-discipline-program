import { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type DemoCommand = {
  id: string;
  title: string;
  group: string;
  hint?: string;
  perform: () => void;
};

const buildDemoCommands = (onPerform: (id: string) => void): DemoCommand[] => [
  {
    id: "plan.create-week",
    title: "Create week",
    group: "Plan",
    hint: "Append a new week",
    perform: () => onPerform("create-week"),
  },
  {
    id: "plan.duplicate-week",
    title: "Duplicate current week",
    group: "Plan",
    hint: "Copy week 1",
    perform: () => onPerform("duplicate-week"),
  },
  {
    id: "plan.jump-to-week",
    title: "Jump to week...",
    group: "Navigation",
    hint: "Available weeks 1–8",
    perform: () => onPerform("jump-to-week"),
  },
  {
    id: "plan.search",
    title: "Search across plan",
    group: "Navigation",
    hint: "Find blocks by title",
    perform: () => onPerform("search-plan"),
  },
  {
    id: "plan.change-block-kind",
    title: "Change block kind of selected block",
    group: "Block",
    hint: "Selected: Strength",
    perform: () => onPerform("change-block-kind"),
  },
  {
    id: "plan.apply-template",
    title: "Apply scheme template to selected segment",
    group: "Segment",
    hint: "Selected: warm-up",
    perform: () => onPerform("apply-template"),
  },
];

type DemoPaletteProps = {
  initiallyOpen?: boolean;
};

const DemoPalette = ({ initiallyOpen = true }: DemoPaletteProps) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastInvoked, setLastInvoked] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commands = useMemo(() => buildDemoCommands(setLastInvoked), []);
  const filtered = useMemo(() => {
    const trimmed = query.trim();

    if (trimmed === "") {
      return commands;
    }

    const lower = trimmed.toLowerCase();

    return commands.filter((command) =>
      `${command.title} ${command.hint ?? ""} ${command.group}`.toLowerCase().includes(lower),
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open palette (Cmd+K)
      </Button>
      <Typography variant="body2">Last invoked: {lastInvoked ?? "—"}</Typography>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogContent
          sx={{ p: 0 }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((prev) => (filtered.length === 0 ? 0 : (prev + 1) % filtered.length));

              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((prev) =>
                filtered.length === 0 ? 0 : (prev - 1 + filtered.length) % filtered.length,
              );

              return;
            }

            if (event.key === "Enter") {
              const choice = filtered[activeIndex];

              if (choice) {
                event.preventDefault();
                close();
                choice.perform();
              }
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <TextField
              inputRef={inputRef}
              size="small"
              fullWidth
              autoFocus
              placeholder="Type a command..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Box>

          {filtered.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No commands match
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.map((command, index) => (
                <ListItem key={command.id} disablePadding>
                  <ListItemButton
                    selected={index === activeIndex}
                    onClick={() => {
                      close();
                      command.perform();
                    }}
                  >
                    <ListItemText
                      primary={command.title}
                      secondary={`${command.group} · ${command.hint ?? ""}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

const meta = {
  title: "Plan Editor/Command Palette",
  component: DemoPalette,
  args: { initiallyOpen: true },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixCommands: Story = {
  args: { initiallyOpen: true },
};

export const Closed: Story = {
  render: () => (
    <Box sx={{ p: 6 }}>
      <StoryPage>
        <StorySection title="palette closed by default">
          <DemoPalette initiallyOpen={false} />
        </StorySection>
      </StoryPage>
    </Box>
  ),
};
