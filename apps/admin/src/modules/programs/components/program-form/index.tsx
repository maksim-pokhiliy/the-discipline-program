import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Stack,
  Typography,
  IconButton,
  Box,
  Chip,
} from "@mui/material";
import { Program } from "@repo/api";
import { useState, useEffect } from "react";

interface ProgramFormProps {
  program?: Program | null;
  onChange: (data: ProgramFormData) => void;
  errors?: Record<string, string>;
}

export interface ProgramFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "UAH", label: "UAH (₴)" },
];

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const ProgramForm = ({ program, onChange, errors = {} }: ProgramFormProps) => {
  const [formData, setFormData] = useState<ProgramFormData>({
    name: "",
    slug: "",
    description: "",
    price: 0,
    currency: "USD",
    features: [""],
    isActive: true,
    sortOrder: 0,
  });

  const [newFeature, setNewFeature] = useState("");
  const [isSlugManuallyChanged, setIsSlugManuallyChanged] = useState(false);

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        slug: program.slug,
        description: program.description,
        price: program.price,
        currency: program.currency,
        features: program.features.length > 0 ? program.features : [""],
        isActive: program.isActive,
        sortOrder: program.sortOrder,
      });
      setIsSlugManuallyChanged(true);
    }
  }, [program]);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleInputChange = <K extends keyof ProgramFormData>(
    field: K,
    value: ProgramFormData[K],
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === "name" && !isSlugManuallyChanged) {
        newData.slug = generateSlug(value as string);
      }

      return newData;
    });
  };

  const handleSlugChange = (value: string) => {
    setIsSlugManuallyChanged(true);
    handleInputChange("slug", value);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const updatedFeatures = formData.features.filter((f) => f.trim() !== "");

      updatedFeatures.push(newFeature.trim());
      handleInputChange("features", updatedFeatures);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index);

    if (updatedFeatures.length === 0) {
      updatedFeatures.push("");
    }

    handleInputChange("features", updatedFeatures);
  };

  const handleFeatureKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFeature();
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <TextField
          label="Program Name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
          fullWidth
        />

        <TextField
          label="Slug"
          value={formData.slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          error={!!errors.slug}
          helperText={errors.slug || "URL-friendly identifier (auto-generated from name)"}
          required
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <Typography variant="body2" color="text.secondary">
                  /{"\u00A0"}
                </Typography>
              ),
            },
          }}
        />
      </Stack>

      <TextField
        label="Description"
        value={formData.description}
        onChange={(e) => handleInputChange("description", e.target.value)}
        error={!!errors.description}
        helperText={errors.description}
        required
        fullWidth
        multiline
        rows={3}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          label="Price"
          type="number"
          value={formData.price}
          onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
          error={!!errors.price}
          helperText={errors.price}
          required
          slotProps={{
            htmlInput: {
              min: 0,
              step: 0.01,
            },
          }}
          sx={{ flex: 2 }}
        />

        <TextField
          select
          label="Currency"
          value={formData.currency}
          onChange={(e) => handleInputChange("currency", e.target.value)}
          sx={{ flex: 1 }}
        >
          {CURRENCIES.map((currency) => (
            <MenuItem key={currency.value} value={currency.value}>
              {currency.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box>
        <Typography variant="h6" gutterBottom>
          Features
        </Typography>

        <Stack spacing={2}>
          {formData.features.map((feature, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="center">
              {feature.trim() ? (
                <Chip
                  label={feature}
                  onDelete={() => removeFeature(index)}
                  deleteIcon={<DeleteIcon />}
                  variant="outlined"
                  sx={{ flex: 1, justifyContent: "space-between" }}
                />
              ) : null}
            </Stack>
          ))}

          <Stack direction="row" spacing={1}>
            <TextField
              placeholder="Add new feature..."
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyUp={handleFeatureKeyPress}
              size="small"
              fullWidth
            />
            <IconButton onClick={addFeature} disabled={!newFeature.trim()} color="primary">
              <AddIcon />
            </IconButton>
          </Stack>

          {errors.features && (
            <Typography variant="caption" color="error">
              {errors.features}
            </Typography>
          )}
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.isActive}
              onChange={(e) => handleInputChange("isActive", e.target.checked)}
            />
          }
          label="Active Program"
        />

        <TextField
          label="Sort Order"
          type="number"
          value={formData.sortOrder}
          onChange={(e) => handleInputChange("sortOrder", parseInt(e.target.value) || 0)}
          error={!!errors.sortOrder}
          helperText={errors.sortOrder}
          size="small"
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ width: 120 }}
        />
      </Stack>
    </Stack>
  );
};
