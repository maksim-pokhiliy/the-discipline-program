import { useQuery } from "@tanstack/react-query";

import { marketingKeys } from "@repo/query";

import { api } from "../api";

export const useReviews = () =>
  useQuery({
    queryKey: marketingKeys.reviews.all(),
    queryFn: api.reviews.getAll,
  });
