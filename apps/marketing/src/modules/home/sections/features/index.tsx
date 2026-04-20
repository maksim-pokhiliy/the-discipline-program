import { type ComponentType } from "react";

import BoltIcon from "@mui/icons-material/Bolt";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupsIcon from "@mui/icons-material/Groups";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SchoolIcon from "@mui/icons-material/School";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Grid, type SvgIconProps } from "@mui/material";

import { type HomePageData } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { FeatureCard } from "@app/lib/components/ui";

type IconComponent = ComponentType<SvgIconProps>;

const FEATURE_ICONS: Record<string, IconComponent> = {
  Shuffle: ShuffleIcon,
  Bolt: BoltIcon,
  FitnessCenter: FitnessCenterIcon,
  School: SchoolIcon,
  TrendingUp: TrendingUpIcon,
  Groups: GroupsIcon,
};

const FALLBACK_ICON: IconComponent = HelpOutlineIcon;

type HomeFeaturesSectionProps = {
  whyChoose: NonNullable<HomePageData["whyChoose"]>;
};

export const HomeFeaturesSection = ({ whyChoose }: HomeFeaturesSectionProps) => {
  return (
    <ContentSection id="why-choose" title={whyChoose.title} subtitle={whyChoose.subtitle}>
      <Grid container spacing={6}>
        {(whyChoose.features ?? []).map((feature, index) => (
          <Grid key={feature.id ?? index} size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={FEATURE_ICONS[feature.iconName ?? ""] ?? FALLBACK_ICON}
              title={feature.title ?? ""}
              description={feature.description ?? ""}
            />
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
