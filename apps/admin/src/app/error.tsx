"use client";

import { ErrorPageContent } from "@repo/ui/error-pages";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage = ({ error, reset }: ErrorPageProps) => (
  <ErrorPageContent error={error} reset={reset} homeLabel="Go to dashboard" />
);

export default ErrorPage;
