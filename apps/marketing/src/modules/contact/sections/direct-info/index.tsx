import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmailIcon from "@mui/icons-material/Email";
import TelegramIcon from "@mui/icons-material/Telegram";
import { Box, Card, CardContent, Grid, IconButton, Stack, Typography } from "@mui/material";

import { type ContactPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface ContactDirectInfoProps {
  directContact: ContactPageData["directContact"];
}

const getContactIcon = (type: string) => {
  switch (type) {
    case "telegram":
      return <TelegramIcon sx={{ fontSize: 32 }} />;
    case "email":
      return <EmailIcon sx={{ fontSize: 32 }} />;
    default:
      return <EmailIcon sx={{ fontSize: 32 }} />;
  }
};

export const ContactDirectInfo = ({ directContact }: ContactDirectInfoProps) => {
  return (
    <ContentSection title={directContact?.title} backgroundColor="dark">
      <Grid container spacing={4}>
        {directContact?.contacts.map((contact, index) => (
          <Grid key={index} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3} alignItems="center">
                  <IconButton
                    component="a"
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      width: 80,
                      height: 80,
                      "&:hover": {
                        bgcolor: "primary.dark",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {getContactIcon(contact.type)}
                  </IconButton>

                  <Stack spacing={1} alignItems="center">
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {contact.label}
                    </Typography>

                    <Typography
                      variant="body1"
                      color="primary"
                      component="a"
                      href={contact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: "none",
                        fontWeight: 500,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {contact.value}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12 }}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                <Box
                  sx={{
                    bgcolor: "secondary.main",
                    color: "white",
                    borderRadius: "50%",
                    width: 80,
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 32 }} />
                </Box>

                <Stack spacing={2} alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Working Hours
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "pre-line",
                      lineHeight: 1.6,
                    }}
                  >
                    {directContact?.workingHours}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ContentSection>
  );
};
