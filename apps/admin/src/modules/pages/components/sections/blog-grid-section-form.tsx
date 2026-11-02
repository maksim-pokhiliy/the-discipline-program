import { type ReactElement } from "react";

import { ARTICLE_LISTING_GROUP } from "../../config/listing-section-fields";

import { FlatFieldGroup } from "./flat-field-group";
import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

export const BlogGridSectionForm = (): ReactElement => (
  <TitleSubtitleSectionForm cardTitle="Articles Grid Settings">
    <FlatFieldGroup group={ARTICLE_LISTING_GROUP} />
  </TitleSubtitleSectionForm>
);
