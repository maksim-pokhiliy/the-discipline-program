"use client";

import { type ReactElement } from "react";

import AddRounded from "@mui/icons-material/AddRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { Box, Button, InputAdornment, Stack, Tabs, TextField, Typography } from "@mui/material";

import { type RecordsViewResponse } from "@repo/contracts/lms/records-view";
import { ChipTab, EmptyState } from "@repo/ui";

import {
  BENCHMARK_TAB_LABEL,
  CONTENT_STACK_GAP,
  EMPTY_BENCHMARK_LABEL,
  EMPTY_ONE_RM_LABEL,
  LIST_GAP,
  NO_RESULTS_LABEL,
  ONE_RM_TAB_LABEL,
  RECORDS_SUBTITLE,
  RECORDS_TITLE,
  SEARCH_FIELD_WIDTH_DESKTOP_PX,
  SEARCH_PLACEHOLDER_BENCHMARK,
  SEARCH_PLACEHOLDER_ONE_RM,
  SECTION_BENCHMARK,
  SECTION_ONE_RM,
  TOOLBAR_CONTROLS_GAP,
  TOOLBAR_GAP,
  TOOLBAR_TITLE_GAP,
  UPDATE_BUTTON_ICON_PX,
  UPDATE_ONE_RM_BUTTON_LABEL,
} from "../utils/athlete-records.constants";
import {
  type RecordsFilter,
  type RecordsSection,
  useRecordsFilter,
} from "../utils/use-records-filter";

import { RecordCard } from "./record-card";
import { UpdateOneRmModal } from "./update-one-rm-modal";

export type RecordsContentProps = {
  data: RecordsViewResponse;
};

const renderTitle = (): ReactElement => (
  <Stack spacing={TOOLBAR_TITLE_GAP} sx={{ minWidth: 0 }}>
    <Typography variant="h1" component="h1">
      {RECORDS_TITLE}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {RECORDS_SUBTITLE}
    </Typography>
  </Stack>
);

const renderSearch = (filter: RecordsFilter, placeholder: string): ReactElement => (
  <TextField
    size="small"
    value={filter.query}
    onChange={(event) => filter.setQuery(event.target.value)}
    placeholder={placeholder}
    sx={{ width: { xs: "100%", md: SEARCH_FIELD_WIDTH_DESKTOP_PX } }}
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchRounded fontSize="small" />
          </InputAdornment>
        ),
      },
    }}
  />
);

const renderControls = (filter: RecordsFilter): ReactElement => {
  const isOneRm = filter.section === SECTION_ONE_RM;
  const placeholder = isOneRm ? SEARCH_PLACEHOLDER_ONE_RM : SEARCH_PLACEHOLDER_BENCHMARK;

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={TOOLBAR_CONTROLS_GAP}
      alignItems={{ xs: "stretch", md: "center" }}
      useFlexGap
    >
      <Tabs
        value={filter.section}
        onChange={(_event, value: RecordsSection) => filter.setSection(value)}
        variant="fullWidth"
        sx={{ width: { md: "auto" } }}
      >
        <ChipTab value={SECTION_ONE_RM} label={ONE_RM_TAB_LABEL} count={filter.oneRMCount} />
        <ChipTab
          value={SECTION_BENCHMARK}
          label={BENCHMARK_TAB_LABEL}
          count={filter.benchmarkCount}
        />
      </Tabs>
      {renderSearch(filter, placeholder)}
      {isOneRm ? (
        <Button
          variant="outlined"
          startIcon={<AddRounded sx={{ fontSize: UPDATE_BUTTON_ICON_PX }} />}
          onClick={() => filter.openModal()}
          sx={{ flexShrink: 0 }}
        >
          {UPDATE_ONE_RM_BUTTON_LABEL}
        </Button>
      ) : null}
    </Stack>
  );
};

const renderOneRmList = (filter: RecordsFilter): ReactElement => {
  if (filter.oneRMCount === 0) {
    return <EmptyState message={EMPTY_ONE_RM_LABEL} />;
  }

  if (filter.filteredOneRM.length === 0) {
    return <EmptyState message={NO_RESULTS_LABEL} />;
  }

  return (
    <Stack spacing={LIST_GAP}>
      {filter.filteredOneRM.map((record) => (
        <RecordCard
          key={record.exerciseId}
          kind="oneRM"
          record={record}
          isOpen={filter.openId === record.exerciseId}
          onToggle={() => filter.toggleOpen(record.exerciseId)}
          onUpdateOneRm={(exerciseId) => filter.openModal(exerciseId)}
        />
      ))}
    </Stack>
  );
};

const renderBenchmarkList = (filter: RecordsFilter): ReactElement => {
  if (filter.benchmarkCount === 0) {
    return <EmptyState message={EMPTY_BENCHMARK_LABEL} />;
  }

  if (filter.filteredBenchmarks.length === 0) {
    return <EmptyState message={NO_RESULTS_LABEL} />;
  }

  return (
    <Stack spacing={LIST_GAP}>
      {filter.filteredBenchmarks.map((record) => (
        <RecordCard
          key={record.plannedSchemaId}
          kind="benchmark"
          record={record}
          isOpen={filter.openId === record.plannedSchemaId}
          onToggle={() => filter.toggleOpen(record.plannedSchemaId)}
          onUpdateOneRm={(exerciseId) => filter.openModal(exerciseId)}
        />
      ))}
    </Stack>
  );
};

export const RecordsContent = ({ data }: RecordsContentProps): ReactElement => {
  const filter = useRecordsFilter(data);

  return (
    <Stack spacing={CONTENT_STACK_GAP}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={TOOLBAR_GAP}
        alignItems={{ xs: "stretch", md: "flex-end" }}
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
      >
        {renderTitle()}
        {renderControls(filter)}
      </Stack>

      <Box>
        {filter.section === SECTION_ONE_RM ? renderOneRmList(filter) : renderBenchmarkList(filter)}
      </Box>

      <UpdateOneRmModal
        open={filter.isModalOpen}
        onClose={filter.closeModal}
        presetExerciseId={filter.modalExerciseId ?? undefined}
        movements={data.oneRM.map((record) => ({
          exerciseId: record.exerciseId,
          exerciseName: record.exerciseName,
        }))}
      />
    </Stack>
  );
};
