import { type ReactNode } from "react";

import { ATHLETE_NAVIGATION } from "@app/lib/config";

import { PlatformLayout } from "./platform-layout";

type AthleteShellProps = {
  mainVariant?: "padded" | "flush";
  children: ReactNode;
};

export const AthleteShell = ({ mainVariant = "padded", children }: AthleteShellProps) => (
  <PlatformLayout
    logoHref="/athlete"
    profileHref="/athlete/profile"
    navigation={ATHLETE_NAVIGATION}
    mainVariant={mainVariant}
  >
    {children}
  </PlatformLayout>
);
