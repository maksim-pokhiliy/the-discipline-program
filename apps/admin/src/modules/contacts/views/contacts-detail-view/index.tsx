"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import {
  ContactStatus,
  type GetContactByIdResponse,
  type UpdateContactRequest,
  updateContactRequestSchema,
} from "@repo/contracts/contact";
import { QueryWrapper } from "@repo/query";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard, FormView } from "@repo/ui";

import { useContact, useUpdateContact } from "@app/lib/hooks";

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  REPLIED: "Replied",
  CLOSED: "Closed",
};

type ContactsDetailFormProps = {
  contact: GetContactByIdResponse;
};

const ContactsDetailForm: React.FC<ContactsDetailFormProps> = ({ contact }) => {
  const router = useRouter();
  const { mutate: updateContact, isPending } = useUpdateContact({
    onSuccess: () => router.push("/contacts"),
  });

  const methods = useForm<UpdateContactRequest>({
    resolver: zodResolver(updateContactRequestSchema),
    defaultValues: {
      status: contact.status as UpdateContactRequest["status"],
      notes: contact.notes ?? null,
    },
  });

  const { control } = methods;

  return (
    <FormView
      methods={methods}
      onSubmit={(data) =>
        updateContact({
          id: contact.id,
          data: {
            status: data.status,
            notes: data.notes?.trim() || null,
          },
        })
      }
      isPending={isPending}
      title="Contact Submission"
      subtitle={contact.name || contact.email || "Anonymous"}
      backHref="/contacts"
      backLabel="Back to List"
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
                <DetailField label="Name" labelWidth={80} value={contact.name || "—"} />
                <DetailField label="Email" labelWidth={80} value={contact.email || "—"} />
                <DetailField label="Program" labelWidth={80} value={contact.program || "—"} />
                <DetailField
                  label="Date"
                  labelWidth={80}
                  value={formatDate(contact.createdAt, "long")}
                />
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
                    {Object.values(ContactStatus).map((status) => (
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
    </FormView>
  );
};

type ContactsDetailViewProps = {
  id: string;
};

export const ContactsDetailView: React.FC<ContactsDetailViewProps> = ({ id }) => {
  const { data, isLoading, error } = useContact(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading contact..."
    >
      {(contact) => <ContactsDetailForm contact={contact} />}
    </QueryWrapper>
  );
};
