"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import type { ExerciseSuggestionItem } from "../extensions/exercise-mention";

export type MentionPopupHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export type MentionPopupProps = {
  items: ExerciseSuggestionItem[];
  command: (item: ExerciseSuggestionItem) => void;
};

export const MentionPopup = forwardRef<MentionPopupHandle, MentionPopupProps>((props, ref) => {
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
    <Paper elevation={6} sx={{ width: 320, maxHeight: 360, overflow: "auto" }}>
      {props.items.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Type to search exercises
          </Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {props.items.map((item, index) => {
            if (item.kind === "existing") {
              return (
                <ListItemButton
                  key={`ex-${item.exercise.id}`}
                  selected={index === selectedIndex}
                  onClick={() => selectItem(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FitnessCenterIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.exercise.canonicalName}
                    secondary={
                      item.exercise.status === "APPROVED" ? undefined : item.exercise.status
                    }
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              );
            }

            return (
              <Box key={`create-${item.query}`}>
                <Divider />
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={() => selectItem(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AddIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Create new exercise: «${item.query}»`}
                    primaryTypographyProps={{ variant: "body2", color: "primary" }}
                  />
                </ListItemButton>
              </Box>
            );
          })}
        </List>
      )}
    </Paper>
  );
});

MentionPopup.displayName = "MentionPopup";
