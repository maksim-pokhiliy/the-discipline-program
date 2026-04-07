import { COACH_NAVIGATION } from "@repo/shared";

import { PlatformLayout } from "@app/lib/components/platform-layout";

const CoachLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <PlatformLayout logoHref="/coach" profileHref="/coach/profile" navigation={COACH_NAVIGATION}>
      {children}
    </PlatformLayout>
  );
};

export default CoachLayout;
