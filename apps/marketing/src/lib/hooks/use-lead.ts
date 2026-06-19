"use client";

import { useMutation } from "@tanstack/react-query";

import { type CreateLeadSubmissionRequest } from "@repo/contracts/cms/contact";

import { api } from "../api";

export const useSubmitLead = () => {
  return useMutation({
    mutationFn: (data: CreateLeadSubmissionRequest) => {
      return api.lead.submit(data);
    },
  });
};
