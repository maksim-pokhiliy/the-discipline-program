"use client";

import { useMemo, useRef, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  ListItemButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { isValid } from "date-fns";
import { toast } from "sonner";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { UserChip } from "@repo/ui";

import {
  toBoardedAt,
  useCoachAthletes,
  useCreateEnrollment,
  useInvalidateEnrollmentCaches,
  usePlanEnrollments,
} from "@app/lib/hooks";

const PICKLIST_MAX_HEIGHT = 280;
const ALREADY_ENROLLED_PATTERN = /already enrolled/i;
const REMOVED_HINT = "· previously removed";
const NO_MATCH_MESSAGE = "No athletes match.";
const NONE_SELECTABLE_MESSAGE = "Every athlete is already enrolled.";
const LOADING_MESSAGE = "Loading athletes…";

const pluralizeAthletes = (count: number): string => (count === 1 ? "athlete" : "athletes");

export type EnrollOutcome = {
  enrolled: number;
  alreadyEnrolled: number;
  failed: number;
};

export const tallyEnrollOutcomes = (results: PromiseSettledResult<unknown>[]): EnrollOutcome =>
  results.reduce<EnrollOutcome>(
    (outcome, result) => {
      if (result.status === "fulfilled") {
        return { ...outcome, enrolled: outcome.enrolled + 1 };
      }

      const message = result.reason instanceof Error ? result.reason.message : "";

      if (ALREADY_ENROLLED_PATTERN.test(message)) {
        return { ...outcome, alreadyEnrolled: outcome.alreadyEnrolled + 1 };
      }

      return { ...outcome, failed: outcome.failed + 1 };
    },
    { enrolled: 0, alreadyEnrolled: 0, failed: 0 },
  );

const announceOutcome = (outcome: EnrollOutcome): void => {
  if (outcome.failed > 0) {
    toast.error(`${outcome.enrolled} enrolled · ${outcome.failed} failed`);

    return;
  }

  if (outcome.alreadyEnrolled > 0) {
    toast.success(`${outcome.enrolled} enrolled · ${outcome.alreadyEnrolled} already on this plan`);

    return;
  }

  toast.success(`Enrolled ${outcome.enrolled} ${pluralizeAthletes(outcome.enrolled)}`);
};

type EnrollAddViewProps = {
  planId: string;
  canEnroll: boolean;
  onBack: () => void;
  onEnrolled: () => void;
};

export const EnrollAddView: React.FC<EnrollAddViewProps> = ({
  planId,
  canEnroll,
  onBack,
  onEnrolled,
}) => {
  const athletesQuery = useCoachAthletes();
  const enrollmentsQuery = usePlanEnrollments(planId);
  const createMutation = useCreateEnrollment(planId);
  const invalidateEnrollmentCaches = useInvalidateEnrollmentCaches(planId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>("");
  const [boardingDate, setBoardingDate] = useState<Date>(new Date());
  const [shouldHidePast, setShouldHidePast] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef(false);

  const enrolledAthleteIds = useMemo(
    () => new Set((enrollmentsQuery.data ?? []).map((enrollment) => enrollment.athleteId)),
    [enrollmentsQuery.data],
  );

  const selectable = useMemo(
    () =>
      (athletesQuery.data?.athletes ?? []).filter(
        (athlete) => !athlete.isPending && !enrolledAthleteIds.has(athlete.userId),
      ),
    [athletesQuery.data, enrolledAthleteIds],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (query.length === 0) {
      return selectable;
    }

    return selectable.filter((athlete) =>
      `${athlete.name ?? ""} ${athlete.email}`.toLowerCase().includes(query),
    );
  }, [selectable, search]);

  const hasRemovedHint = (athlete: CoachAthleteListItem): boolean =>
    athlete.enrollments.some(
      (enrollment) =>
        enrollment.planId === planId && enrollment.status === EnrollmentStatus.REMOVED,
    );

  const toggleSelected = (userId: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const handleDateChange = (next: Date | null) => {
    if (next && isValid(next)) {
      setBoardingDate(next);
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const ids = [...selectedIds];
    const results = await Promise.allSettled(
      ids.map((athleteId) =>
        createMutation.mutateAsync({
          athleteId,
          boardedAt: toBoardedAt(boardingDate),
          hidePastBeforeBoarding: shouldHidePast,
        }),
      ),
    );

    invalidateEnrollmentCaches();

    const outcome = tallyEnrollOutcomes(results);

    announceOutcome(outcome);
    setIsSubmitting(false);
    isSubmittingRef.current = false;

    if (outcome.enrolled > 0) {
      onEnrolled();
    }
  };

  const selectedCount = selectedIds.size;
  const isRosterLoading = athletesQuery.isPending || enrollmentsQuery.isPending;
  const isPicklistEmpty = filtered.length === 0;
  const hasNoneSelectable = selectable.length === 0;
  const isEnrollDisabled = selectedCount === 0 || isSubmitting || !canEnroll;

  return (
    <Stack spacing={2}>
      <Box>
        <Button variant="text" size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>
          Manage enrollments
        </Button>
      </Box>

      <TextField
        label="Search athletes"
        size="small"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ maxHeight: PICKLIST_MAX_HEIGHT, overflowY: "auto" }}>
        {isPicklistEmpty ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            {isRosterLoading
              ? LOADING_MESSAGE
              : hasNoneSelectable
                ? NONE_SELECTABLE_MESSAGE
                : NO_MATCH_MESSAGE}
          </Typography>
        ) : (
          <Stack>
            {filtered.map((athlete) => (
              <ListItemButton
                key={athlete.userId}
                onClick={() => toggleSelected(athlete.userId)}
                sx={{ gap: 1 }}
              >
                <Checkbox
                  edge="start"
                  checked={selectedIds.has(athlete.userId)}
                  tabIndex={-1}
                  disableRipple
                  readOnly
                />
                <UserChip
                  size="small"
                  user={{
                    id: athlete.userId,
                    name: athlete.name,
                    email: athlete.email,
                    image: athlete.image,
                  }}
                  {...(hasRemovedHint(athlete) && {
                    secondary: (
                      <Typography variant="caption" color="text.secondary">
                        {REMOVED_HINT}
                      </Typography>
                    ),
                  })}
                />
              </ListItemButton>
            ))}
          </Stack>
        )}
      </Box>

      <DatePicker
        label="Boarding date"
        value={boardingDate}
        onChange={handleDateChange}
        slotProps={{ textField: { size: "small" } }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={shouldHidePast}
            onChange={(event) => setShouldHidePast(event.target.checked)}
          />
        }
        label="Hide pre-boarding history"
      />

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="text" onClick={onBack} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<GroupAddIcon />}
          disabled={isEnrollDisabled}
          onClick={handleSubmit}
        >
          Enroll {selectedCount} {pluralizeAthletes(selectedCount)}
        </Button>
      </Stack>
    </Stack>
  );
};
