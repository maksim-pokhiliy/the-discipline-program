import { ExerciseStatus } from "@repo/contracts/library/exercise";

import { ExercisesView } from "@app/modules/library-exercises";

const LibraryExercisesReviewPage = () => (
  <ExercisesView
    defaultStatusFilter={ExerciseStatus.PENDING_REVIEW}
    title="Review queue"
    subtitle="Exercises awaiting admin review"
  />
);

export default LibraryExercisesReviewPage;
