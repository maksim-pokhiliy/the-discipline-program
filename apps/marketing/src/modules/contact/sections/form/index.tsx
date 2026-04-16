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
      title={form.title}
      subtitle={form.subtitle}
      maxWidth="md"
      surface="raised"
    >
      {isSuccess ? (
        <Stack spacing={3} alignItems="center" sx={{ textAlign: "center" }}>
          <Typography variant="display2" component="h2">
            {form.successTitle}
          </Typography>

          <Typography variant="h4" color="text.secondary">
            {form.successMessage}
          </Typography>

          <Button variant="contained" size="large" onClick={() => resetMutation()}>
            {form.sendAnotherLabel}
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
                label={fieldLabels.name}
                required
                fullWidth
                disabled={isPending}
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register("name")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={fieldLabels.contact}
                required
                fullWidth
                disabled={isPending}
                placeholder={fieldPlaceholders.contact}
                error={!!errors.contact}
                helperText={errors.contact?.message}
                {...register("contact")}
              />
            </Grid>
          </Grid>

          <TextField
            select
            label={fieldLabels.program}
            fullWidth
            disabled={isPending}
            defaultValue=""
            error={!!errors.program}
            helperText={errors.program?.message}
            {...register("program")}
          >
            {programOptions.map((option) => (
              <MenuItem key={option.slug} value={option.slug}>
                {option.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={fieldLabels.message}
            required
            multiline
            rows={4}
            fullWidth
            disabled={isPending}
            placeholder={fieldPlaceholders.message}
            error={!!errors.message}
            helperText={errors.message?.message}
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
