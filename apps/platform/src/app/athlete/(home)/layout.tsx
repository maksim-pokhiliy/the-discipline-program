import { type ReactNode } from "react";

import { AthleteShell } from "@app/lib/components";

const AthleteHomeLayout = ({ children }: { children: ReactNode }) => (
  <AthleteShell mainVariant="flush">{children}</AthleteShell>
);

export default AthleteHomeLayout;
