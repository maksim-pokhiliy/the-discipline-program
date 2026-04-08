import { PlatformLayout } from "@app/lib/components";
import { ATHLETE_NAVIGATION } from "@app/lib/config";

const AthleteLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <PlatformLayout
      logoHref="/athlete"
      profileHref="/athlete/profile"
      navigation={ATHLETE_NAVIGATION}
    >
      {children}
    </PlatformLayout>
  );
};

export default AthleteLayout;
