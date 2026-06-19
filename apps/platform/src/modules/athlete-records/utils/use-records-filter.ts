"use client";

import { useMemo, useState } from "react";

import {
  type BenchmarkRecordView,
  type OneRMRecordView,
  type RecordsViewResponse,
} from "@repo/contracts/lms/records-view";

import { type SECTION_BENCHMARK, SECTION_ONE_RM } from "./athlete-records.constants";

export type RecordsSection = typeof SECTION_ONE_RM | typeof SECTION_BENCHMARK;

export type RecordsFilter = {
  section: RecordsSection;
  query: string;
  openId: string | null;
  isModalOpen: boolean;
  modalExerciseId: string | null;
  oneRMCount: number;
  benchmarkCount: number;
  filteredOneRM: OneRMRecordView[];
  filteredBenchmarks: BenchmarkRecordView[];
  setSection: (section: RecordsSection) => void;
  setQuery: (query: string) => void;
  toggleOpen: (id: string) => void;
  openModal: (exerciseId?: string) => void;
  closeModal: () => void;
};

const matches = (haystack: string, needle: string): boolean =>
  haystack.toLowerCase().includes(needle.trim().toLowerCase());

export const useRecordsFilter = (data: RecordsViewResponse): RecordsFilter => {
  const [section, setSectionState] = useState<RecordsSection>(SECTION_ONE_RM);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExerciseId, setModalExerciseId] = useState<string | null>(null);

  const filteredOneRM = useMemo(
    () => data.oneRM.filter((record) => matches(record.exerciseName, query)),
    [data.oneRM, query],
  );

  const filteredBenchmarks = useMemo(
    () => data.benchmarks.filter((record) => matches(record.title, query)),
    [data.benchmarks, query],
  );

  const setSection = (next: RecordsSection): void => {
    setSectionState(next);
    setQuery("");
    setOpenId(null);
  };

  const toggleOpen = (id: string): void => {
    setOpenId((current) => (current === id ? null : id));
  };

  const openModal = (exerciseId?: string): void => {
    setModalExerciseId(exerciseId ?? null);
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setModalExerciseId(null);
  };

  return {
    section,
    query,
    openId,
    isModalOpen,
    modalExerciseId,
    oneRMCount: data.oneRM.length,
    benchmarkCount: data.benchmarks.length,
    filteredOneRM,
    filteredBenchmarks,
    setSection,
    setQuery,
    toggleOpen,
    openModal,
    closeModal,
  };
};
