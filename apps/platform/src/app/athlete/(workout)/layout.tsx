import { type ReactNode } from "react";

import { AthleteShell } from "@app/lib/components";

const AthleteWorkoutLayout = ({ children }: { children: ReactNode }) => (
  <AthleteShell mainVariant="flush">{children}</AthleteShell>
);

export default AthleteWorkoutLayout;
