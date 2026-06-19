"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";

import {
  type CreateLeadSubmissionRequest,
  createLeadSubmissionSchema,
} from "@repo/contracts/cms/contact";
import { type Product } from "@repo/contracts/cms/product";
import { BaseModal } from "@repo/ui";

import { useSubmitLead } from "@app/lib/hooks";

type LeadFormModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

export const LeadFormModal = ({ product, open, onClose }: LeadFormModalProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors, isValid },
  } = useForm<CreateLeadSubmissionRequest>({
    resolver: zodResolver(createLeadSubmissionSchema),
    defaultValues: { name: "", contact: "", program: product?.slug ?? "", message: "" },
    mode: "onChange",
  });

  const { mutate, isPending, isSuccess, error, reset: resetMutation } = useSubmitLead();

  const productSlug = product?.slug;

  useEffect(() => {
    if (productSlug === undefined) {
      return;
    }

    setValue("program", productSlug);
  }, [productSlug, setValue]);

  if (!product) {
    return null;
  }

  const onSubmit = (data: CreateLeadSubmissionRequest) => {
    mutate(data, { onSuccess: () => resetForm() });
  };

  return (
    <BaseModal open={open} onClose={onClose} title="Get started">
      {isSuccess ? (
        <Stack spacing={3} alignItems="center" sx={{ textAlign: "center" }}>
          <Typography variant="h2" component="h2">
            You&apos;re all set
          </Typography>

          <Typography variant="h4" color="text.secondary">
            Thanks for your interest. We&apos;ll reach out to you shortly.
          </Typography>

          <Button variant="contained" size="large" onClick={() => resetMutation()}>
            Send another
          </Button>
        </Stack>
      ) : (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          {error && (
            <Alert severity="error">
              <Typography variant="body2">
                {error instanceof Error ? error.message : "Something went wrong. Please try again."}
              </Typography>
            </Alert>
          )}

          <Typography variant="h5" color="text.secondary">
            You&apos;re getting: {product.title}
          </Typography>

          <TextField
            label="Name"
            fullWidth
            disabled={isPending}
            error={!!errors.name}
            {...(errors.name?.message !== undefined && { helperText: errors.name.message })}
            {...register("name")}
          />

          <TextField
            label="Contact (phone, Telegram, email)"
            required
            fullWidth
            disabled={isPending}
            error={!!errors.contact}
            {...(errors.contact?.message !== undefined && { helperText: errors.contact.message })}
            {...register("contact")}
          />

          <TextField
            label="Message (optional)"
            multiline
            rows={4}
            fullWidth
            disabled={isPending}
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
            {isPending ? "Sending…" : "Send"}
          </Button>
        </Stack>
      )}
    </BaseModal>
  );
};
