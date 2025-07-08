import { Program } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui/content-section";

import { ProgramsTable } from "../programs-table";

interface ProgramsTableSectionProps {
  programs: Program[];
}

export const ProgramsTableSection = ({ programs }: ProgramsTableSectionProps) => {
  return (
    <ContentSection backgroundColor="dark">
      <ProgramsTable programs={programs} />
    </ContentSection>
  );
};
