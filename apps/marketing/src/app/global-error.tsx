"use client";

import { GlobalErrorPageContent } from "@repo/ui";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalErrorPage = ({ reset }: GlobalErrorPageProps) => (
  <GlobalErrorPageContent reset={reset} />
);

export default GlobalErrorPage;
