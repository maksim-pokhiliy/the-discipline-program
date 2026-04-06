"use client";

import { useCallback, useEffect, useState } from "react";

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Chip, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/athlete-profile";
import type { CoachAthletePlan } from "@repo/contracts/coach-athletes";

type AthletesFiltersSectionProps = {
  plans: CoachAthletePlan[];
};

const HEALTH_FILTERS = [
  { value: HealthStatus.INJURED, label: HEALTH_STATUS_LABELS[HealthStatus.INJURED] },
  { value: HealthStatus.RESTRICTED, label: HEALTH_STATUS_LABELS[HealthStatus.RESTRICTED] },
];

export const AthletesFiltersSection: React.FC<AthletesFiltersSectionProps> = ({ plans }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";
  const currentHealth = searchParams.get("healthStatus") ?? "";
  const currentPlan = searchParams.get("planId") ?? "";
  const currentAttention = searchParams.get("needsAttention") === "true";

  const [searchInput, setSearchInput] = useState(currentSearch);

  const hasActiveFilters = currentSearch || currentHealth || currentPlan || currentAttention;

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const toggleParam = (key: string, value: string) => {
    const current = searchParams.get(key);

    updateParam(key, current === value ? null : value);
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
    setSearchInput("");
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateParam("search", searchInput || null);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput, currentSearch, updateParam]);

  return (
    <Stack spacing={1.5}>
      <TextField
        size="small"
        placeholder="Search by name or email..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchInput("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Chip
          label="Needs Attention"
          color={currentAttention ? "warning" : "default"}
          variant={currentAttention ? "filled" : "outlined"}
          onClick={() => toggleParam("needsAttention", "true")}
        />

        {HEALTH_FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            color={currentHealth === filter.value ? "error" : "default"}
            variant={currentHealth === filter.value ? "filled" : "outlined"}
            onClick={() => toggleParam("healthStatus", filter.value)}
          />
        ))}

        {plans.map((plan) => (
          <Chip
            key={plan.id}
            label={plan.name}
            color={currentPlan === plan.id ? "primary" : "default"}
            variant={currentPlan === plan.id ? "filled" : "outlined"}
            onClick={() => toggleParam("planId", plan.id)}
          />
        ))}

        {hasActiveFilters && (
          <Chip label="Clear" variant="outlined" onDelete={clearAll} onClick={clearAll} />
        )}
      </Stack>
    </Stack>
  );
};
