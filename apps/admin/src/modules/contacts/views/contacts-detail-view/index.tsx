"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Controller, FormProvider, useForm } from "react-hook-form";

import {
  CONTACT_STATUSES,
  type GetContactByIdResponse,
  type UpdateContactStatusRequest,
  updateContactStatusRequestSchema,
} from "@repo/contracts/contact";
import { ContentSection, FormCard } from "@repo/ui";

import { useContact, useUpdateContactStatus } from "@app/lib/hooks";

interface ContactsDetailViewProps {
  initialData: GetContactByIdResponse;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  REPLIED: "Replied",
  CLOSED: "Closed",
};

export const ContactsDetailView = ({ initialData }: ContactsDetailViewProps) => {
  const { data: contact } = useContact(initialData.id, initialData);
  const { mutate: updateStatus, isPending } = useUpdateContactStatus();

  const currentStatus = (contact?.status ||
    initialData.status) as UpdateContactStatusRequest["status"];

  const methods = useForm<UpdateContactStatusRequest>({
    resolver: zodResolver(updateContactStatusRequestSchema),
    defaultValues: {
      status: currentStatus,
    },
  });

  const { handleSubmit, control } = methods;

  if (!contact) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Contact Submission"
        subtitle={contact.name || contact.email || "Anonymous"}
        backHref="/contacts"
        backLabel="Back to List"
        actions={[
          {
            label: "Save Status",
            onClick: handleSubmit((data) => updateStatus({ id: contact.id, data })),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              <FormCard title="Message">
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {contact.message}
                </Typography>
              </FormCard>

              <FormCard title="Contact Details">
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="subtitle2" sx={{ minWidth: 80 }}>
                      Name:
                    </Typography>
                    <Typography variant="body2">{contact.name || "—"}</Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Typography variant="subtitle2" sx={{ minWidth: 80 }}>
                      Email:
                    </Typography>
                    <Typography variant="body2">{contact.email || "—"}</Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Typography variant="subtitle2" sx={{ minWidth: 80 }}>
                      Program:
                    </Typography>
                    <Typography variant="body2">{contact.program || "—"}</Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Typography variant="subtitle2" sx={{ minWidth: 80 }}>
                      Date:
                    </Typography>
                    <Typography variant="body2">{formatDate(contact.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </FormCard>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <FormCard title="Status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth size="small" disabled={isPending}>
                    {CONTACT_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </FormCard>
          </Grid>
        </Grid>
      </ContentSection>
    </FormProvider>
  );
};
