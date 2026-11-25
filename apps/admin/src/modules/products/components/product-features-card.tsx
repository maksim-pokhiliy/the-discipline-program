"use client";

import { type ReactElement } from "react";

import { Stack } from "@mui/material";

import { FormCard } from "@app/lib/components/form-card";
import { SectionListEditor } from "@app/lib/components/localized-editor/section-list";

import { PRODUCT_FEATURES_LIST } from "../config";

export const ProductFeaturesCard = (): ReactElement => (
  <FormCard title="Features List" subtitle="Bullet points for the marketing card">
    <Stack spacing={3}>
      <SectionListEditor list={PRODUCT_FEATURES_LIST} />
    </Stack>
  </FormCard>
);
