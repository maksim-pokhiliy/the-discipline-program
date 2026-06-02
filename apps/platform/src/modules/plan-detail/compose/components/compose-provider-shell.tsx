"use client";

import { type ReactNode, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { platformKeys } from "@app/lib/api/keys";

import { MOCK_EXERCISES } from "../compose-mock-exercises";

const OFFLINE_ERROR = "compose mock: no network";

const createMockClient = (): QueryClient => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: false,
        queryFn: () => {
          throw new Error(OFFLINE_ERROR);
        },
      },
    },
  });

  client.setQueryData(platformKeys.exercises.all(), MOCK_EXERCISES);

  return client;
};

type ComposeProviderShellProps = {
  children: ReactNode;
};

export const ComposeProviderShell: React.FC<ComposeProviderShellProps> = ({ children }) => {
  const [client] = useState(createMockClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
