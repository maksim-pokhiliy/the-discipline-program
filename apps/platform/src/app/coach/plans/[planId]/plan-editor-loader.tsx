"use client";

import dynamic from "next/dynamic";

const PlanEditorView = dynamic(
  () => import("@app/modules/plan-editor").then((m) => ({ default: m.PlanEditorView })),
  { ssr: false },
);

export type PlanEditorLoaderProps = {
  planId: string;
};

export const PlanEditorLoader = ({ planId }: PlanEditorLoaderProps) => (
  <PlanEditorView planId={planId} />
);
