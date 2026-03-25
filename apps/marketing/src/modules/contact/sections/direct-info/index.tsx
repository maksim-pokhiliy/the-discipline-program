import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import TelegramIcon from "@mui/icons-material/Telegram";
import { Avatar, Grid, Link, Stack, Typography } from "@mui/material";

import { ContactMethodType, type ContactPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

const CONTACT_ICONS: Record<ContactMethodType, typeof EmailIcon> = {
  [ContactMethodType.TELEGRAM]: TelegramIcon,
  [ContactMethodType.EMAIL]: EmailIcon,
  [ContactMethodType.PHONE]: PhoneIcon,
};

interface ContactDirectInfoProps {
  directContact: ContactPageData["directContact"];
}

export const ContactDirectInfo = ({ directContact }: ContactDirectInfoProps) => {
  return (
    <ContentSection title={directContact.title} surface="raised">
      <Grid container spacing={4} justifyContent="center">
        {directContact.contacts.map((contact) => {
          const Icon = CONTACT_ICONS[contact.type];

          return (
            <Grid key={contact.type} size={{ xs: 12, sm: 6 }}>
              <Stack spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                  <Icon />
                </Avatar>

                <Typography variant="h5">{contact.label}</Typography>

                <Link
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                  variant="body1"
                >
                  {contact.value}
                </Link>
              </Stack>
            </Grid>
          );
        })}
      </Grid>
    </ContentSection>
  );
};
