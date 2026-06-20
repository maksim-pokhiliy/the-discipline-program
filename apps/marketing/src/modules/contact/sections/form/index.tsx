"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";

import {
  type CreateContactSubmissionRequest,
  createContactSubmissionSchema,
} from "@repo/contracts/cms/contact";
import { type ContactPageData } from "@repo/contracts/cms/pages";
import { ContentSection } from "@repo/ui";

import { useSubmitContact } from "@app/lib/hooks";

type ContactFormSectionProps = {
  form: NonNullable<ContactPageData["form"]>;
  programOptions: ContactPageData["programOptions"];
};

export const ContactFormSection = ({
  form: { fieldLabels, fieldPlaceholders, ...form },
  programOptions,
}: ContactFormSectionProps) => {
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isValid },
  } = useForm<CreateContactSubmissionRequest>({
    resolver: zodResolver(createContactSubmissionSchema),
    defaultValues: { name: "", contact: "", program: "", message: "" },
    mode: "onChange",
  });

  const { mutate, isPending, isSuccess, error, reset: resetMutation } = useSubmitContact();

  const onSubmit = (data: CreateContactSubmissionRequest) => {
    mutate(data, { onSuccess: () => resetForm() });
  };

  return (
    <ContentSection
      id="contact-form"
      title={isSuccess ? undefined : form.title}
      subtitle={isSuccess ? undefined : form.subtitle}
      maxWidth="md"
      surface="raised"
    >
      {isSuccess ? (
        <Stack spacing={3} alignItems="center" sx={{ textAlign: "center" }}>
          <Typography variant="h2" component="h2">
            {form.successTitle}
          </Typography>

          <Typography variant="h4" color="text.secondary">
            {form.successMessage}
          </Typography>

          <Button variant="contained" size="large" onClick={() => resetMutation()}>
            {form.sendAnotherLabel ?? "Send another"}
          </Button>
        </Stack>
      ) : (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          {error && (
            <Alert severity="error">
              <Typography variant="body2">
                {error instanceof Error ? error.message : form.errorMessage}
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={fieldLabels?.name ?? "Name"}
                required
                fullWidth
                disabled={isPending}
                error={!!errors.name}
                {...(errors.name?.message !== undefined && { helperText: errors.name.message })}
                {...register("name")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={fieldLabels?.contact ?? "Email or phone"}
                required
                fullWidth
                disabled={isPending}
                {...(fieldPlaceholders?.contact !== undefined && {
                  placeholder: fieldPlaceholders.contact,
                })}
                error={!!errors.contact}
                {...(errors.contact?.message !== undefined && {
                  helperText: errors.contact.message,
                })}
                {...register("contact")}
              />
            </Grid>
          </Grid>

          <TextField
            select
            label={fieldLabels?.program ?? "Program"}
            fullWidth
            disabled={isPending}
            defaultValue=""
            error={!!errors.program}
            {...(errors.program?.message !== undefined && { helperText: errors.program.message })}
            {...register("program")}
          >
            {programOptions.map((option) => (
              <MenuItem key={option.slug} value={option.slug}>
                {option.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={fieldLabels?.message ?? "Message"}
            required
            multiline
            rows={4}
            fullWidth
            disabled={isPending}
            {...(fieldPlaceholders?.message !== undefined && {
              placeholder: fieldPlaceholders.message,
            })}
            error={!!errors.message}
            {...(errors.message?.message !== undefined && { helperText: errors.message.message })}
            {...register("message")}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!isValid || isPending}
            startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isPending ? form.sendingLabel : form.submitLabel}
          </Button>
        </Stack>
      )}
    </ContentSection>
  );
};
