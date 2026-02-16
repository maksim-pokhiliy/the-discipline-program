"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm } from "react-hook-form";

import {
  CONTACT_STATUSES,
  type GetContactByIdResponse,
  type UpdateContactRequest,
  updateContactRequestSchema,
} from "@repo/contracts/contact";
import { formatDate } from "@repo/shared";
import { ContentSection, FormCard } from "@repo/ui";

import { useContact, useUpdateContact } from "@app/lib/hooks";

interface ContactsDetailViewProps {
  initialData: GetContactByIdResponse;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  REPLIED: "Replied",
  CLOSED: "Closed",
};

export const ContactsDetailView = ({ initialData }: ContactsDetailViewProps) => {
  const router = useRouter();
  const { data: contact } = useContact(initialData.id, initialData);
  const { mutate: updateContact, isPending } = useUpdateContact({
    onSuccess: () => router.push("/contacts"),
  });

  const methods = useForm<UpdateContactRequest>({
    resolver: zodResolver(updateContactRequestSchema),
    defaultValues: {
      status: (contact?.status || initialData.status) as UpdateContactRequest["status"],
      notes: contact?.notes ?? initialData.notes ?? null,
    },
  });

  const { handleSubmit, control, reset } = methods;

  useEffect(() => {
    if (contact) {
      reset({
        status: contact.status as UpdateContactRequest["status"],
        notes: contact.notes ?? null,
      });
    }
  }, [contact, reset]);

  if (!contact) {
    return null;
  }

  const onSubmit = (data: UpdateContactRequest) => {
    updateContact({
      id: contact.id,
      data: {
        status: data.status,
        notes: data.notes?.trim() || null,
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Contact Submission"
        subtitle={contact.name || contact.email || "Anonymous"}
        backHref="/contacts"
        backLabel="Back to List"
        actions={[
          {
            label: "Save Changes",
            onClick: handleSubmit(onSubmit),
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
                    <Typography variant="body2">{formatDate(contact.createdAt, "long")}</Typography>
                  </Stack>
                </Stack>
              </FormCard>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
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

              <FormCard title="Notes">
                <Controller
                  name="notes"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      multiline
                      rows={6}
                      fullWidth
                      size="small"
                      placeholder="Add internal notes about this contact..."
                      disabled={isPending}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </FormCard>
            </Stack>
          </Grid>
        </Grid>
      </ContentSection>
    </FormProvider>
  );
};
