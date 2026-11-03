import { type ReactElement } from "react";

import { PROGRAM_LISTING_GROUP } from "../../config/listing-section-fields";

import { FlatFieldGroup } from "./flat-field-group";
import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

export const StorefrontGridSectionForm = (): ReactElement => (
  <TitleSubtitleSectionForm cardTitle="Programs Grid Settings">
    <FlatFieldGroup group={PROGRAM_LISTING_GROUP} />
  </TitleSubtitleSectionForm>
);
