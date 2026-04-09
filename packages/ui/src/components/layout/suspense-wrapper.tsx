import { Suspense } from "react";

import { LoadingState } from "../loading-state";

type SuspenseWrapperProps = {
  children: React.ReactNode;
  loadingMessage?: string;
};

export const SuspenseWrapper = ({
  children,
  loadingMessage = "Loading...",
}: SuspenseWrapperProps) => {
  return (
    <Suspense fallback={<LoadingState message={loadingMessage} minHeight="50vh" />}>
      {children}
    </Suspense>
  );
};
