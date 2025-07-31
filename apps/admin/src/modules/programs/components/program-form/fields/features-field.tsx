import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Typography, Stack, Chip, TextField, IconButton, Box } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { Control, useWatch, FieldErrors } from "react-hook-form";

import { ProgramFormData } from "../../shared/types";

interface FeaturesFieldProps {
  control: Control<ProgramFormData>;
  errors: FieldErrors<ProgramFormData>;
  isSubmitting: boolean;
  onFeaturesChange: (features: string[]) => void;
}

export const FeaturesField = ({
  control,
  errors,
  isSubmitting,
  onFeaturesChange,
}: FeaturesFieldProps) => {
  const watchedFeatures = useWatch({ control, name: "features" });
  const currentFeatures = useMemo(() => watchedFeatures || [], [watchedFeatures]);

  const [features, setFeatures] = useState<string[]>(currentFeatures);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    setFeatures(currentFeatures);
  }, [currentFeatures]);

  const addFeature = () => {
    if (newFeature.trim()) {
      const updatedFeatures = [...features, newFeature.trim()];

      setFeatures(updatedFeatures);
      onFeaturesChange(updatedFeatures);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = features.filter((_, i) => i !== index);

    setFeatures(updatedFeatures);
    onFeaturesChange(updatedFeatures);
  };

  const handleFeatureKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFeature();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Features
      </Typography>

      <Stack spacing={2}>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {features.map((feature, index) => (
            <Stack key={`${feature}-${index}`} direction="row" spacing={1} alignItems="center">
              <Chip
                label={feature}
                onDelete={() => removeFeature(index)}
                deleteIcon={<DeleteIcon />}
                variant="outlined"
              />
            </Stack>
          ))}
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            placeholder="Add new feature..."
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyUp={handleFeatureKeyPress}
            size="small"
            fullWidth
            disabled={isSubmitting}
          />
          <IconButton
            onClick={addFeature}
            disabled={!newFeature.trim() || isSubmitting}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Stack>

        {errors.features && (
          <Typography variant="caption" color="error">
            {errors.features.message}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
