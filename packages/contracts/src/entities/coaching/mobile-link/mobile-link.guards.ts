import {
  type GeneralMobileLink,
  type IndividualMobileLink,
  type MobileLink,
} from "./mobile-link.types";

export const isGeneralMobileLink = (link: MobileLink): link is GeneralMobileLink =>
  link.channel === "GENERAL";

export const isIndividualMobileLink = (link: MobileLink): link is IndividualMobileLink =>
  link.channel === "INDIVIDUAL";

export const partitionMobileLinks = (
  links: MobileLink[],
): { general: GeneralMobileLink[]; individual: IndividualMobileLink[] } => ({
  general: links.filter(isGeneralMobileLink),
  individual: links.filter(isIndividualMobileLink),
});
