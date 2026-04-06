import { Box, Stack, Typography, useTheme } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type SwatchProps = {
  color: string;
  label: string;
};

const Swatch = ({ color, label }: SwatchProps) => (
  <Stack spacing={0.5} sx={{ alignItems: "center" }}>
    <Box
      sx={{
        width: 64,
        height: 64,
        borderRadius: 1,
        bgcolor: color,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    />
    <Typography variant="caption" sx={{ opacity: 0.7 }}>
      {label}
    </Typography>
    <Typography variant="caption" sx={{ opacity: 0.4 }}>
      {color}
    </Typography>
  </Stack>
);

type PaletteGroupProps = {
  title: string;
  colors: { label: string; color: string }[];
};

const PaletteGroup = ({ title, colors }: PaletteGroupProps) => (
  <StorySection title={title}>
    {colors.map(({ label, color }) => (
      <Swatch key={label} label={label} color={color} />
    ))}
  </StorySection>
);

const PaletteShowcase = () => {
  const theme = useTheme();
  const { palette } = theme;

  return (
    <StoryPage>
      <PaletteGroup
        title="primary"
        colors={[
          { label: "light", color: palette.primary.light },
          { label: "main", color: palette.primary.main },
          { label: "dark", color: palette.primary.dark },
        ]}
      />

      <PaletteGroup
        title="secondary"
        colors={[
          { label: "light", color: palette.secondary.light },
          { label: "main", color: palette.secondary.main },
          { label: "dark", color: palette.secondary.dark },
        ]}
      />

      <PaletteGroup
        title="error"
        colors={[
          { label: "light", color: palette.error.light },
          { label: "main", color: palette.error.main },
          { label: "dark", color: palette.error.dark },
        ]}
      />

      <PaletteGroup
        title="warning"
        colors={[
          { label: "light", color: palette.warning.light },
          { label: "main", color: palette.warning.main },
          { label: "dark", color: palette.warning.dark },
        ]}
      />

      <PaletteGroup
        title="success"
        colors={[
          { label: "light", color: palette.success.light },
          { label: "main", color: palette.success.main },
          { label: "dark", color: palette.success.dark },
        ]}
      />

      <PaletteGroup
        title="info"
        colors={[
          { label: "light", color: palette.info.light },
          { label: "main", color: palette.info.main },
          { label: "dark", color: palette.info.dark },
        ]}
      />

      <PaletteGroup
        title="background"
        colors={[
          { label: "default", color: palette.background.default },
          { label: "paper", color: palette.background.paper },
        ]}
      />

      <StorySection title="text">
        <Stack spacing={1}>
          <Typography color="text.primary">
            text.primary — {String(palette.text.primary)}
          </Typography>
          <Typography color="text.secondary">
            text.secondary — {String(palette.text.secondary)}
          </Typography>
          <Typography color="text.disabled">
            text.disabled — {String(palette.text.disabled)}
          </Typography>
        </Stack>
      </StorySection>

      <StorySection title="divider">
        <Box
          sx={{
            width: "100%",
            height: 2,
            bgcolor: "divider",
          }}
        />
        <Typography variant="caption" sx={{ opacity: 0.5 }}>
          {palette.divider}
        </Typography>
      </StorySection>

      <PaletteGroup
        title="grey scale"
        colors={[
          { label: "50", color: palette.grey[50] },
          { label: "100", color: palette.grey[100] },
          { label: "200", color: palette.grey[200] },
          { label: "300", color: palette.grey[300] },
          { label: "400", color: palette.grey[400] },
          { label: "500", color: palette.grey[500] },
          { label: "600", color: palette.grey[600] },
          { label: "700", color: palette.grey[700] },
          { label: "800", color: palette.grey[800] },
          { label: "900", color: palette.grey[900] },
        ]}
      />
    </StoryPage>
  );
};

const meta = {
  title: "Theme/Palette",
  component: PaletteShowcase,
} satisfies Meta<typeof PaletteShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => <PaletteShowcase />,
};
