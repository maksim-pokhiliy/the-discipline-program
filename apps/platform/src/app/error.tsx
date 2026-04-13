"use client";

import { ErrorPageContent } from "@repo/ui";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage = ({ error, reset }: ErrorPageProps) => (
  <ErrorPageContent error={error} reset={reset} />
);

export default ErrorPage;
