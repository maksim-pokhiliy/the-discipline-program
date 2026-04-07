import { COACH_NAVIGATION } from "@repo/shared";

import { PlatformLayout } from "@app/lib/components/platform-layout";

const AthleteLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <PlatformLayout
      logoHref="/athlete"
      profileHref="/athlete/profile"
      navigation={COACH_NAVIGATION}
    >
      {children}
    </PlatformLayout>
  );
};

export default AthleteLayout;
