import { PlatformLayout } from "@app/lib/components";
import { COACH_NAVIGATION } from "@app/lib/config";

const CoachLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <PlatformLayout
      logoHref="/coach"
      profileHref="/coach/profile"
      navigation={COACH_NAVIGATION}
      showSidebar
    >
      {children}
    </PlatformLayout>
  );
};

export default CoachLayout;
