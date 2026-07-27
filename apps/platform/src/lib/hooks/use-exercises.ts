"use client";

import { useQuery } from "@tanstack/react-query";

import type { Exercise, GetAthleteMovementsResponse } from "@repo/contracts/lms/exercise";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useExercises = () =>
  useQuery<Exercise[]>({
    queryKey: platformKeys.exercises.all(),
    queryFn: () => api.exercises.list(),
    staleTime: Infinity,
  });

export const useAthleteMovements = () =>
  useQuery<GetAthleteMovementsResponse>({
    queryKey: platformKeys.exercises.forAthlete(),
    queryFn: () => api.exercises.listForAthlete(),
    staleTime: Infinity,
  });
