import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const usePrograms = () =>
  useQuery({
    queryKey: ["marketing", "programs"],
    queryFn: api.programs.getAll,
  });
