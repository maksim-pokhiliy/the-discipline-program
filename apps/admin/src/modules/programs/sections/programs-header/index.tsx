import { Add } from "@mui/icons-material";
import { Button, Box } from "@mui/material";

import { ContentSection } from "@app/shared/components/ui/content-section";

export const ProgramsHeaderSection = () => {
  return (
    <ContentSection title="Programs Management" backgroundColor="dark">
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={<Add />}>
          Add Program
        </Button>
      </Box>
    </ContentSection>
  );
};
