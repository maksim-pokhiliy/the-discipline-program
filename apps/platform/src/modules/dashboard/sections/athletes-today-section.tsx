"use client";

import { useMemo, useState } from "react";

import { SearchRounded } from "@mui/icons-material";
import { Card, CardContent, InputAdornment, Stack, TextField, Typography } from "@mui/material";

import type { AthleteDailySummary } from "@repo/contracts/coach-dashboard";

import { AthleteSummaryCard } from "../components";

type AthletesTodaySectionProps = {
  athletes: AthleteDailySummary[];
};

export const AthletesTodaySection = ({ athletes }: AthletesTodaySectionProps) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return athletes;
    }

    const query = search.toLowerCase().trim();

    return athletes.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.planName?.toLowerCase().includes(query),
    );
  }, [athletes, search]);

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Athletes Today
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {athletes.length} total
            </Typography>
          </Stack>
          {athletes.length > 3 && (
            <TextField
              size="small"
              placeholder="Search athletes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ fontSize: 18, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.85rem",
                },
              }}
            />
          )}
          <Stack>
            {filtered.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", py: 2, textAlign: "center" }}
              >
                {search ? "No athletes match your search" : "No athletes enrolled"}
              </Typography>
            ) : (
              filtered.map((athlete) => (
                <AthleteSummaryCard key={athlete.userId} athlete={athlete} />
              ))
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
