"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreatePerformedSchemaResultRequest } from "@repo/contracts/lms/performed-schema-result";
import { notifyError } from "@repo/query";

import { api } from "../api";

type CreatePerformedSchemaResultArgs = {
  performedSessionId: string;
  data: CreatePerformedSchemaResultRequest;
};

export const useCreatePerformedSchemaResult = () =>
  useMutation({
    mutationFn: ({ performedSessionId, data }: CreatePerformedSchemaResultArgs) =>
      api.performedSchemaResults.create(performedSessionId, data),
    onSuccess: () => {
      toast.success("Result saved");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save result");
    },
  });
