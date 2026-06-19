"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { RecordsViewResponse } from "@repo/contracts/lms/records-view";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useAthleteRecords = (): UseQueryResult<RecordsViewResponse, Error> => {
  return useQuery({
    queryKey: platformKeys.athleteRecords.data(),
    queryFn: () => api.athleteRecords.get(),
  });
};
