import { useState } from "react";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

// Проверь, что путь к типам верный (зависит от структуры экспортов в твоем contracts)
import type { CreateContactSubmissionRequest } from "@repo/contracts/contact";
import { type ContactPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

// Импорт твоего хука
import { useSubmitContact } from "@app/lib/hooks";

interface ContactFormProps {
  form: ContactPageData["form"];
}

export const ContactForm = ({ form }: ContactFormProps) => {
  // 1. Стейт только для данных формы
  const [formData, setFormData] = useState<CreateContactSubmissionRequest>({
    name: "",
    email: "",
    program: "",
    message: "",
  });

  // 2. Логика отправки через React Query (hook)
  const { mutate, isPending, isSuccess, error, reset } = useSubmitContact();

  const handleChange =
    (field: keyof CreateContactSubmissionRequest) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      // Сбрасываем ошибку/успех при редактировании
      if (error || isSuccess) {
        reset();
      }
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    mutate(formData, {
      onSuccess: () => {
        setFormData({ name: "", email: "", program: "", message: "" });
      },
    });
  };

  const isValid = formData.name.trim() && formData.email.trim() && formData.message.trim();

  return (
    <ContentSection title={form?.title} subtitle={form?.subtitle}>
      <Grid container justifyContent="center">
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {isSuccess ? (
                <Alert severity="success" sx={{ width: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Message sent successfully! 🎉
                  </Typography>

                  <Typography variant="body2">
                    Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                  </Typography>

                  <Button onClick={() => reset()} sx={{ mt: 2 }} size="small">
                    Send another message
                  </Button>
                </Alert>
              ) : (
                <Stack component="form" onSubmit={handleSubmit} spacing={3}>
                  {error && (
                    <Alert severity="error">
                      <Typography variant="body2">
                        {error instanceof Error ? error.message : "Something went wrong"}
                      </Typography>
                    </Alert>
                  )}

                  <TextField
                    label="Your Name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    required
                    fullWidth
                    disabled={isPending}
                  />

                  <TextField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    required
                    fullWidth
                    disabled={isPending}
                  />

                  {form?.programs && (
                    <TextField
                      select
                      label="Program Interest"
                      value={formData.program}
                      onChange={handleChange("program")}
                      fullWidth
                      disabled={isPending}
                    >
                      {form.programs.map((program) => (
                        <MenuItem key={program.value} value={program.value}>
                          {program.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}

                  <TextField
                    label="Your Message"
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={handleChange("message")}
                    required
                    fullWidth
                    disabled={isPending}
                    placeholder="Tell us about your fitness goals..."
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={!isValid || isPending}
                    sx={{ py: 2 }}
                    startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {isPending ? "Sending..." : "Send Message"}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ContentSection>
  );
};
