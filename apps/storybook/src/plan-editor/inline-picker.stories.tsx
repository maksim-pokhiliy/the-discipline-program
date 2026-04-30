import { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  ClickAwayListener,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type DemoOption = {
  id: string;
  label: string;
  group?: string;
};

const exampleOptions: DemoOption[] = [
  { id: "tpl:emom", label: "EMOM 5 min — squat focus", group: "Scheme template" },
  { id: "tpl:tabata", label: "Tabata — 8x20s", group: "Scheme template" },
  { id: "tpl:amrap", label: "AMRAP 12 min", group: "Scheme template" },
  { id: "bk:strength", label: "Strength", group: "Block kind" },
  { id: "bk:warmup", label: "Warm-up", group: "Block kind" },
];

type DemoPickerProps = {
  initiallyOpen?: boolean;
  options?: DemoOption[];
  loading?: boolean;
};

const DemoPicker = ({
  initiallyOpen = true,
  options = exampleOptions,
  loading = false,
}: DemoPickerProps) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const anchorRef = useRef<HTMLInputElement | null>(null);

  const visible = useMemo(() => {
    const trimmed = query.trim();

    if (trimmed === "") {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(trimmed.toLowerCase()));
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  return (
    <Stack spacing={2} sx={{ width: 480 }}>
      <Typography variant="caption" color="text.secondary">
        Demo of an inline picker primitive — anchor at field, ArrowUp/Down + Enter, Escape.
      </Typography>
      <TextField
        inputRef={anchorRef}
        size="small"
        label="Segment label"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "/") {
            setOpen(true);

            return;
          }

          if (event.key === "Escape") {
            setOpen(false);

            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => (visible.length === 0 ? 0 : (prev + 1) % visible.length));

            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) =>
              visible.length === 0 ? 0 : (prev - 1 + visible.length) % visible.length,
            );

            return;
          }

          if (event.key === "Enter") {
            const choice = visible[activeIndex];

            if (choice) {
              event.preventDefault();
              setSelected(choice.label);
              setOpen(false);
              setQuery("");
            }
          }
        }}
        helperText="Inline picker host"
      />
      <Typography variant="body2">Selected: {selected ?? "—"}</Typography>

      {open && anchorRef.current ? (
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}
        >
          <ClickAwayListener onClickAway={() => setOpen(false)}>
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
            >
              {loading ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading...
                  </Typography>
                </Box>
              ) : visible.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No results
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {visible.map((option, index) => (
                    <ListItem key={option.id} disablePadding>
                      <ListItemButton
                        selected={index === activeIndex}
                        onClick={() => {
                          setSelected(option.label);
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        <ListItemText primary={option.label} secondary={option.group} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </ClickAwayListener>
        </Popper>
      ) : null}
    </Stack>
  );
};

const meta = {
  title: "Plan Editor/Inline Picker",
  component: DemoPicker,
  args: { initiallyOpen: true },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenWithResults: Story = {
  args: { initiallyOpen: true },
};

export const Empty: Story = {
  args: { initiallyOpen: true, options: [] },
};

export const Loading: Story = {
  args: { initiallyOpen: true, loading: true, options: [] },
};

export const Closed: Story = {
  render: () => (
    <Box sx={{ p: 6 }}>
      <StoryPage>
        <StorySection title="default closed state">
          <DemoPicker initiallyOpen={false} />
        </StorySection>
      </StoryPage>
    </Box>
  ),
};
