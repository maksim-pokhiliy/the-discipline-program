import { SuspenseWrapper } from "@repo/ui";

import { ExerciseLibraryView } from "@app/modules/exercise-library";

const ExerciseLibraryPage = () => (
  <SuspenseWrapper>
    <ExerciseLibraryView />
  </SuspenseWrapper>
);

export default ExerciseLibraryPage;
