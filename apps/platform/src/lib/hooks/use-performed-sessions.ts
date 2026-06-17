"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreatePerformedSessionRequest } from "@repo/contracts/lms/performed-session";
import { notifyError } from "@repo/query";

import { api } from "../api";

export const useCreatePerformedSession = () =>
  useMutation({
    mutationFn: (data: CreatePerformedSessionRequest) => api.performedSessions.create(data),
    onSuccess: () => {
      toast.success("Session logged");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to log session");
    },
  });
