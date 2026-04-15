"use client";

import { Divider } from "@mui/material";

import { DetailDrawer } from "@repo/ui";

import { useCoachAthleteDetail } from "@app/lib/hooks";

import { AttentionSection } from "./attention-section";
import { ConsistencySection } from "./consistency-section";
import { DisciplineSection } from "./discipline-section";
import { PassportSection } from "./passport-section";
import { RecentWorkoutsSection } from "./recent-workouts-section";

type AthleteDetailDrawerProps = {
  athleteId: string | null;
  onClose: () => void;
};

export const AthleteDetailDrawer: React.FC<AthleteDetailDrawerProps> = ({ athleteId, onClose }) => {
  const { data, isLoading } = useCoachAthleteDetail(athleteId);

  return (
    <DetailDrawer
      open={!!athleteId}
      onClose={onClose}
      title="Athlete Details"
      loading={isLoading || !data}
    >
      {data && (
        <>
          <PassportSection
            name={data.name}
            email={data.email}
            image={data.image}
            healthStatus={data.healthStatus}
            processStatus={data.processStatus}
            daysSinceLastActivity={data.daysSinceLastActivity}
            nextWorkout={data.nextWorkout}
            enrolledSince={data.enrolledSince}
          />
          <Divider />
          <DisciplineSection planDiscipline={data.planDiscipline} />
          <Divider />
          <AttentionSection actionItems={data.actionItems} />
          {data.actionItems.length > 0 && <Divider />}
          <ConsistencySection consistency={data.consistency} />
          <Divider />
          <RecentWorkoutsSection workouts={data.recentWorkouts} />
        </>
      )}
    </DetailDrawer>
  );
};
