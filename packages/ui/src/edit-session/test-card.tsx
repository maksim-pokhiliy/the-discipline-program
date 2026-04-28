import { useEffect, useState } from "react";

import { z } from "zod";

import { useEditSession } from "./use-edit-session";

export type TestDraft = { value: string; version?: number };

export const testDraftSchema = z.object({
  value: z.string().min(1),
  version: z.number().optional(),
});

export type TestCardProps = {
  sessionId: string;
  initial: TestDraft;
  mutationFn: (draft: TestDraft, version: number) => Promise<TestDraft>;
  expectedVersion?: number;
  label?: string;
  dispatchValue?: string;
  shouldDispatch?: boolean;
};

export const TestCard = ({
  sessionId,
  initial,
  mutationFn,
  expectedVersion = 1,
  label,
  dispatchValue,
  shouldDispatch = false,
}: TestCardProps) => {
  const session = useEditSession<TestDraft>({
    sessionId,
    initial,
    expectedVersion,
    label,
    validate: (draft) => testDraftSchema.safeParse(draft),
    mutationKey: ["card-test", sessionId],
    mutationFn,
  });

  const [didDispatch, setDidDispatch] = useState(false);

  useEffect(() => {
    if (shouldDispatch && !didDispatch) {
      setDidDispatch(true);
      session.dispatch({ value: dispatchValue ?? "" });
    }
  }, [didDispatch, dispatchValue, session, shouldDispatch]);

  return (
    <div>
      <input
        data-testid={`input-${sessionId}`}
        data-edit-session-id={sessionId}
        value={session.draft.value}
        onChange={(event) => session.dispatch({ value: event.target.value })}
      />
      <span data-testid={`status-${sessionId}`}>{session.status}</span>
    </div>
  );
};
