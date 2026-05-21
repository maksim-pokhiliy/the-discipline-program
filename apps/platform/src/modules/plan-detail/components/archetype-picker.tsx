"use client";

import { Fragment } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Typography,
} from "@mui/material";

import type { Archetype } from "@repo/contracts/lms/archetype";
import type { ArchetypeFamily } from "@repo/contracts/lms/schema";
import { BaseModal } from "@repo/ui";

import { useArchetypes } from "@app/lib/hooks";

import type { SelectedArchetype } from "./schema-editor-types";

const ARCHETYPE_FAMILY_LABELS: Record<ArchetypeFamily, string> = {
  ROUNDS_SETS: "Rounds & sets",
  LADDER: "Ladders",
  TIME_CAP: "Time-capped",
  COMPOSITE_ROUNDS: "Composite rounds",
  NESTED: "Nested",
  NAMED: "Named formats",
  SINGLE_LINE_HEADERLESS: "Single-line",
  FLAT_PARALLEL_HEADERLESS: "Flat & parallel",
  MODALITY_REFERENCE: "Modality reference",
};

type ArchetypeGroup = {
  family: ArchetypeFamily;
  archetypes: Archetype[];
};

const groupByFamily = (archetypes: Archetype[]): ArchetypeGroup[] => {
  const groups: ArchetypeGroup[] = [];

  for (const archetype of archetypes) {
    const lastGroup = groups.at(-1);

    if (lastGroup !== undefined && lastGroup.family === archetype.family) {
      lastGroup.archetypes.push(archetype);

      continue;
    }

    groups.push({ family: archetype.family, archetypes: [archetype] });
  }

  return groups;
};

type ArchetypePickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (archetype: SelectedArchetype) => void;
};

export const ArchetypePicker: React.FC<ArchetypePickerProps> = ({ open, onClose, onSelect }) => {
  const { data: archetypes, isLoading, isError } = useArchetypes();

  const handleSelect = (archetype: Archetype) => {
    onSelect({ archetypeId: archetype.id, name: archetype.name, kind: archetype.kind });
    onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} title="Add schema" maxWidth="sm">
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">Failed to load formats</Alert>}

      {!isLoading && !isError && archetypes !== undefined && archetypes.length === 0 && (
        <Typography color="text.secondary">No formats available</Typography>
      )}

      {!isLoading && !isError && archetypes !== undefined && archetypes.length > 0 && (
        <List disablePadding>
          {groupByFamily(archetypes).map((group) => (
            <Fragment key={group.family}>
              <ListSubheader disableSticky>{ARCHETYPE_FAMILY_LABELS[group.family]}</ListSubheader>

              {group.archetypes.map((archetype) => (
                <ListItemButton key={archetype.id} onClick={() => handleSelect(archetype)}>
                  <ListItemText
                    primary={archetype.name}
                    secondary={archetype.headerPatternDescription}
                  />
                </ListItemButton>
              ))}
            </Fragment>
          ))}
        </List>
      )}
    </BaseModal>
  );
};
