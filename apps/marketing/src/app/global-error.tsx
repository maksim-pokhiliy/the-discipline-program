"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

import { GlobalErrorPageContent } from "@repo/ui/error-pages";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalErrorPage = ({ error, reset }: GlobalErrorPageProps) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <GlobalErrorPageContent reset={reset} />;
};

export default GlobalErrorPage;
