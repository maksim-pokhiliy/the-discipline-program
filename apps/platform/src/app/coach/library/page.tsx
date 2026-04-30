import { SuspenseWrapper } from "@repo/ui";

import { LibraryView } from "@app/modules/library";

const LibraryPage = () => (
  <SuspenseWrapper>
    <LibraryView />
  </SuspenseWrapper>
);

export default LibraryPage;
