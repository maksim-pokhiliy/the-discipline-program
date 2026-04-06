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
} from "@repo/contracts/contact";
import { type ContactPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { useSubmitContact } from "@app/lib/hooks";

interface ContactFormSectionProps {
  form: ContactPageData["form"];
  programOptions: ContactPageData["programOptions"];
}

export const ContactFormSection = ({ form, programOptions }: ContactFormSectionProps) => {
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
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography variant="display2" component="h2">
            Message Sent
          </Typography>

          <Typography variant="h4" color="text.secondary">
            Thank you for reaching out. We&apos;ll get back to you soon.
          </Typography>

          <Button variant="contained" size="large" onClick={() => resetMutation()}>
            Send Another
          </Button>
        </Stack>
      ) : (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          {error && (
            <Alert severity="error">
              <Typography variant="body2">
                {error instanceof Error ? error.message : "Something went wrong"}
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Name"
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
                label="Phone / Telegram / WhatsApp"
                required
                fullWidth
                disabled={isPending}
                placeholder="+380..., @username"
                error={!!errors.contact}
                helperText={errors.contact?.message}
                {...register("contact")}
              />
            </Grid>
          </Grid>

          <TextField
            select
            label="Program Interest"
            fullWidth
            disabled={isPending}
            defaultValue=""
            error={!!errors.program}
            helperText={errors.program?.message}
            {...register("program")}
          >
            {programOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Your Message"
            required
            multiline
            rows={4}
            fullWidth
            disabled={isPending}
            placeholder="Tell us about your goals..."
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
            {isPending ? "Sending..." : "Send Message"}
          </Button>
        </Stack>
      )}
    </ContentSection>
  );
};
