import { notFound } from "next/navigation";

export const fetchOrNotFound = async <T>(fetcher: () => Promise<T>): Promise<T> => {
  try {
    return await fetcher();
  } catch {
    return notFound();
  }
};
