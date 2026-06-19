"use client";

import { type ReactElement } from "react";

import { QueryWrapper } from "@repo/ui";

import { useAthleteSessionView } from "@app/lib/hooks";

import { SessionContent } from "../components";
import { LOADING_LABEL } from "../utils/athlete-session.constants";

export type AthleteSessionViewProps = {
  sessionId: string;
};

export const AthleteSessionView = ({ sessionId }: AthleteSessionViewProps): ReactElement => {
  const { data, isLoading, error } = useAthleteSessionView(sessionId);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage={LOADING_LABEL}>
      {(loaded) => <SessionContent data={loaded} />}
    </QueryWrapper>
  );
};
