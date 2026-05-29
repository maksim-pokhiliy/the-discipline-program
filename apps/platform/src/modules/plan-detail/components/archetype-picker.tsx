"use client";

import { useMemo, useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { Archetype } from "@repo/contracts/lms/archetype";
import {
  ARCHETYPE_FAMILIES,
  type ArchetypeFamily,
  type ArchetypeName,
} from "@repo/contracts/lms/schema";
import { BaseModal } from "@repo/ui";

import { useArchetypes } from "@app/lib/hooks";

import { ArchetypePickerTile } from "./archetype-picker-tile";
import type { SelectedArchetype } from "./schema-editor-types";

const ARCHETYPE_FAMILY_LABELS: Record<ArchetypeFamily, string> = {
  ROUNDS_SETS: "Rounds & sets",
  LADDER: "Ladders",
  TIME_CAP: "Time-capped",
  COMPOSITE_ROUNDS: "Composite rounds",
  NESTED: "Nested (rounds / intervals)",
  NAMED: "Named formats",
  SINGLE_LINE_HEADERLESS: "Single-line · headerless",
  FLAT_PARALLEL_HEADERLESS: "Flat parallel · headerless",
  MODALITY_REFERENCE: "Modality reference",
};

const ARCHETYPE_FAMILY_GLYPH: Record<ArchetypeFamily, string> = {
  ROUNDS_SETS: "N×",
  LADDER: "↓↑",
  TIME_CAP: "○:○",
  COMPOSITE_ROUNDS: "R+r",
  NESTED: "R⊃R",
  NAMED: "≈",
  SINGLE_LINE_HEADERLESS: "—",
  FLAT_PARALLEL_HEADERLESS: "≡",
  MODALITY_REFERENCE: "↦",
};

const DEFERRED_ARCHETYPES: ReadonlySet<ArchetypeName> = new Set<ArchetypeName>([
  "super-set",
  "composite-intervals-then-rounds",
  "composite-intervals-on-off-max-tail",
  "named-exercise-program",
]);

const DEFERRED_HINT: Partial<Record<ArchetypeName, string>> = {
  "super-set": "needs body-row wiring — coming soon",
  "composite-intervals-then-rounds": "needs exercise editor — coming soon",
  "composite-intervals-on-off-max-tail": "needs exercise editor — coming soon",
  "named-exercise-program": "needs exercise editor — coming soon",
};

const TILE_LIST_MAX_HEIGHT_FACTOR = 52;

type ArchetypeFamilyGroup = {
  family: ArchetypeFamily;
  label: string;
  archetypes: Archetype[];
};

const matchesQuery = (archetype: Archetype, query: string): boolean => {
  const haystack = [
    archetype.name,
    archetype.label,
    archetype.headerPatternDescription,
    archetype.family,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

const buildGroups = (archetypes: Archetype[], query: string): ArchetypeFamilyGroup[] => {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered =
    normalizedQuery === ""
      ? archetypes
      : archetypes.filter((archetype) => matchesQuery(archetype, normalizedQuery));

  return ARCHETYPE_FAMILIES.reduce<ArchetypeFamilyGroup[]>((groups, family) => {
    const members = filtered.filter((archetype) => archetype.family === family);

    if (members.length > 0) {
      groups.push({ family, label: ARCHETYPE_FAMILY_LABELS[family], archetypes: members });
    }

    return groups;
  }, []);
};

const tileHint = (archetype: Archetype): string =>
  DEFERRED_ARCHETYPES.has(archetype.name)
    ? (DEFERRED_HINT[archetype.name] ?? archetype.headerPatternDescription)
    : archetype.headerPatternDescription;

type ArchetypePickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (archetype: SelectedArchetype) => void;
};

export const ArchetypePicker: React.FC<ArchetypePickerProps> = ({ open, onClose, onSelect }) => {
  const { data: archetypes, isLoading, isError } = useArchetypes();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<ArchetypeName | null>(null);

  const groups = useMemo(() => buildGroups(archetypes ?? [], query), [archetypes, query]);

  const handlePick = (archetype: Archetype): void => {
    onSelect({ archetypeId: archetype.id, name: archetype.name, kind: archetype.kind });
    onClose();
  };

  const handleContinue = (): void => {
    const selected = (archetypes ?? []).find((archetype) => archetype.name === selectedId);

    if (selected === undefined) {
      return;
    }

    handlePick(selected);
  };

  const hasArchetypes = archetypes !== undefined && archetypes.length > 0;
  const isEmptyResult = !isLoading && !isError && hasArchetypes && groups.length === 0;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Add schema"
      subtitle="step 1 of 2"
      maxWidth="md"
      actions={
        <>
          <Box sx={{ flexGrow: 1 }} />

          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="contained" disabled={selectedId === null} onClick={handleContinue}>
            Continue
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          size="small"
          autoFocus={true}
          fullWidth={true}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search archetypes…"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.subtle" }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && <Alert severity="error">Failed to load formats</Alert>}

        {!isLoading && !isError && !hasArchetypes && (
          <Typography sx={{ color: "text.secondary" }}>No formats available</Typography>
        )}

        {isEmptyResult && (
          <Typography sx={{ color: "text.subtle", py: 3, textAlign: "center" }}>
            {`No archetypes match "${query.trim()}"`}
          </Typography>
        )}

        {!isLoading && !isError && groups.length > 0 && (
          <Box
            sx={(theme) => ({
              maxHeight: theme.spacing(TILE_LIST_MAX_HEIGHT_FACTOR),
              overflowY: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            })}
          >
            {groups.map((group) => (
              <Box key={group.family}>
                <Typography
                  variant="overline"
                  sx={(theme) => ({
                    display: "block",
                    px: 1.5,
                    pt: 1,
                    pb: 0.5,
                    color: "text.subtle",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    bgcolor: theme.palette.background.paper,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  })}
                >
                  {`${group.label} — ${group.archetypes.length}`}
                </Typography>

                {group.archetypes.map((archetype) => (
                  <ArchetypePickerTile
                    key={archetype.id}
                    archetype={archetype}
                    glyph={ARCHETYPE_FAMILY_GLYPH[archetype.family]}
                    isSelected={selectedId === archetype.name}
                    isDeferred={DEFERRED_ARCHETYPES.has(archetype.name)}
                    hint={tileHint(archetype)}
                    onSelect={() => setSelectedId(archetype.name)}
                    onConfirm={() => handlePick(archetype)}
                  />
                ))}
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};
