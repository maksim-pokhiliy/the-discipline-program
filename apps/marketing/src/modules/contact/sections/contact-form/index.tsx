import {
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ContactPageData } from "@repo/api";
import { useState } from "react";

import { ContentSection } from "@app/shared/components/ui/content-section";

interface ContactFormProps {
  form: ContactPageData["form"];
}

interface FormData {
  name: string;
  email: string;
  program: string;
  message: string;
}

interface SubmissionState {
  isSubmitting: boolean;
  submitted: boolean;
  error: string | null;
}

export const ContactForm = ({ form }: ContactFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    program: "",
    message: "",
  });

  const [submission, setSubmission] = useState<SubmissionState>({
    isSubmitting: false,
    submitted: false,
    error: null,
  });

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    if (submission.error) {
      setSubmission((prev) => ({ ...prev, error: null }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setSubmission({ isSubmitting: true, submitted: false, error: null });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setSubmission({
        isSubmitting: false,
        submitted: true,
        error: null,
      });

      setFormData({ name: "", email: "", program: "", message: "" });
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        submitted: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  };

  const isValid = formData.name.trim() && formData.email.trim() && formData.message.trim();

  return (
    <ContentSection title={form.title} subtitle={form.subtitle}>
      <Grid container justifyContent="center">
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {submission.submitted ? (
                <Alert severity="success" sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Message sent successfully! 🎉
                  </Typography>

                  <Typography variant="body2">
                    Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                  </Typography>
                </Alert>
              ) : (
                <Stack component="form" onSubmit={handleSubmit} spacing={3}>
                  {submission.error && (
                    <Alert severity="error">
                      <Typography variant="body2">{submission.error}</Typography>
                    </Alert>
                  )}

                  <TextField
                    label="Your Name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    required
                    fullWidth
                    disabled={submission.isSubmitting}
                  />

                  <TextField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    required
                    fullWidth
                    disabled={submission.isSubmitting}
                  />

                  <TextField
                    select
                    label="Program Interest"
                    value={formData.program}
                    onChange={handleChange("program")}
                    fullWidth
                    disabled={submission.isSubmitting}
                  >
                    {form.programs.map((program) => (
                      <MenuItem key={program.value} value={program.value}>
                        {program.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Your Message"
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={handleChange("message")}
                    required
                    fullWidth
                    disabled={submission.isSubmitting}
                    placeholder="Tell us about your fitness goals, experience level, or any questions you have..."
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={!isValid || submission.isSubmitting}
                    sx={{ py: 2 }}
                    startIcon={submission.isSubmitting ? <CircularProgress size={20} /> : null}
                  >
                    {submission.isSubmitting ? "Sending..." : "Send Message"}
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
