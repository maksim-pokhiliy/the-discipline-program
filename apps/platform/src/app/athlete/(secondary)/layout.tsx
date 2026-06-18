import { type ReactNode } from "react";

import { AthleteShell } from "@app/lib/components";

const AthleteSecondaryLayout = ({ children }: { children: ReactNode }) => (
  <AthleteShell>{children}</AthleteShell>
);

export default AthleteSecondaryLayout;
