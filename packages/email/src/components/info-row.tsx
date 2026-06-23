import { Text } from "@react-email/components";

import { theme } from "../theme";

type InfoRowProps = {
  label: string;
  value: string;
};

export const InfoRow = ({ label, value }: InfoRowProps) => (
  <Text style={theme.infoRow}>
    <span style={theme.label}>{label}:</span> {value}
  </Text>
);
