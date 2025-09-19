import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useReviews = () =>
  useQuery({
    queryKey: ["marketing", "reviews"],
    queryFn: api.reviews.getAll,
  });
