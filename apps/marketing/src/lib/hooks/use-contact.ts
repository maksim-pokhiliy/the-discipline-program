import { useMutation } from "@tanstack/react-query";

import { type CreateContactSubmissionRequest } from "@repo/contracts/contact";

import { api } from "../api";

export const useSubmitContact = () => {
  return useMutation({
    mutationFn: (data: CreateContactSubmissionRequest) => {
      return api.contact.submit(data);
    },
  });
};
