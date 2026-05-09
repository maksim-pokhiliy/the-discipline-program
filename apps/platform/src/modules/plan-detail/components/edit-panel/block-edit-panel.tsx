"use client";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, FormProvider } from "react-hook-form";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type PlanBlock, PLAN_BLOCK_CONSTANTS } from "@repo/contracts/lms/plan-block";
import { type PlanItem } from "@repo/contracts/lms/plan-item";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";
import { MultiSelect, SchemeParamsField } from "@repo/ui";

import { useCreatePlanBlock, useUpdatePlanBlock } from "@app/lib/hooks";

import {
  type BlockFormValues,
  toCreatePlanBlockRequest,
  toUpdatePlanBlockRequest,
  useBlockEditForm,
} from "../../lib/use-block-edit-form";
import { useSubmitGuard } from "../../lib/use-submit-guard";

import { BlockItemList } from "./block-item-list";
import { EditPanel } from "./edit-panel";
import { type SaveStatusChange } from "./edit-panel-status";

const BLOCK_TYPE_HELPER = `Select between ${PLAN_BLOCK_CONSTANTS.MIN_BLOCK_TYPES} and ${PLAN_BLOCK_CONSTANTS.MAX_BLOCK_TYPES}`;
const NO_SCHEME_TYPE_VALUE = "";
const DEFAULT_ERROR_MESSAGE = "Save failed";

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;

type BlockEditPanelLookups = {
  readonly schemeTypes: ReadonlyMap<string, SchemeType>;
  readonly blockTypes: ReadonlyMap<string, BlockType>;
  readonly exercises: ReadonlyMap<string, Exercise>;
};

type BlockEditPanelProps = {
  planId: string;
  sessionId: string;
  blockId: string | null;
  existingBlock?: PlanBlock | null;
  existingBlocks: readonly PlanBlock[];
  existingItems: readonly PlanItem[];
  lookups: BlockEditPanelLookups;
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onStatusChange?: SaveStatusChange;
};

export const BlockEditPanel: React.FC<BlockEditPanelProps> = ({
  planId,
  sessionId,
  blockId,
  existingBlock,
  existingBlocks,
  existingItems,
  lookups,
  onClose,
  onDirtyChange,
  onStatusChange,
}) => {
  const createBlock = useCreatePlanBlock({ planId, sessionId });
  const updateBlock = useUpdatePlanBlock({ planId, sessionId });

  const form = useBlockEditForm({
    existingBlock,
    existingBlocks,
    existingItems,
    schemeTypes: lookups.schemeTypes,
    ...(onDirtyChange !== undefined ? { onDirtyChange } : {}),
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isDirty, errors },
  } = form;

  const isCreate = blockId === null;
  const schemeTypeOptions = Array.from(lookups.schemeTypes.values());
  const blockTypeOptions = Array.from(lookups.blockTypes.values());
  const isSaving = createBlock.isPending || updateBlock.isPending;

  const submitData = async (data: BlockFormValues): Promise<void> => {
    onStatusChange?.("saving");

    try {
      if (blockId === null) {
        await createBlock.mutateAsync(toCreatePlanBlockRequest(data));
      } else {
        await updateBlock.mutateAsync({
          id: blockId,
          data: toUpdatePlanBlockRequest(data),
        });
      }

      reset(data);
      onStatusChange?.("saved");
      onClose();
    } catch (error) {
      onStatusChange?.("error", {
        message: toErrorMessage(error),
        retry: () => submitData(data),
      });
    }
  };

  const onSubmit = useSubmitGuard(handleSubmit(submitData));

  const title = isCreate ? "Add block" : "Edit block";

  return (
    <FormProvider {...form}>
      <EditPanel
        open
        onClose={onClose}
        title={title}
        isDirty={isDirty}
        isSaving={isSaving}
        canSave={isDirty && Object.keys(errors).length === 0}
        onSave={() => void onSubmit()}
        onCancel={onClose}
      >
        <Stack spacing={3}>
          <TextField
            label="Order"
            type="number"
            size="small"
            fullWidth
            disabled={isSaving}
            error={Boolean(errors.order)}
            helperText={errors.order?.message}
            inputProps={{ min: 0, step: 1 }}
            {...register("order", { valueAsNumber: true })}
          />

          <Controller
            name="schemeTypeId"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth size="small" error={Boolean(fieldState.error)}>
                <InputLabel id="scheme-type-label">Scheme type</InputLabel>
                <Select
                  labelId="scheme-type-label"
                  label="Scheme type"
                  value={field.value === "" ? NO_SCHEME_TYPE_VALUE : field.value}
                  onChange={(event) => {
                    const next = event.target.value;

                    field.onChange(next);

                    const schemeType = lookups.schemeTypes.get(next);

                    if (schemeType) {
                      setValue("schemeArchetypeKind", schemeType.archetypeKind, {
                        shouldDirty: true,
                      });
                    }
                  }}
                  onBlur={field.onBlur}
                  disabled={isSaving}
                >
                  <MenuItem value={NO_SCHEME_TYPE_VALUE} disabled>
                    <em>Select a scheme type</em>
                  </MenuItem>
                  {schemeTypeOptions.map((schemeType) => (
                    <MenuItem key={schemeType.id} value={schemeType.id}>
                      {schemeType.name}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error?.message !== undefined && (
                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="blockTypeIds"
            control={control}
            render={({ field, fieldState }) => (
              <MultiSelect<BlockType>
                options={blockTypeOptions}
                value={field.value}
                onChange={field.onChange}
                getOptionId={(option) => option.id}
                getOptionLabel={(option) => option.name}
                label="Block types"
                placeholder="Select block types"
                helperText={BLOCK_TYPE_HELPER}
                {...(fieldState.error?.message !== undefined
                  ? { errorText: fieldState.error.message }
                  : {})}
                disabled={isSaving}
              />
            )}
          />

          <SchemeParamsField
            basePath="schemeParams"
            kindPath="schemeArchetypeKind"
            isLoading={isSaving}
          />

          <TextField
            label="Notes"
            placeholder="Optional notes"
            multiline
            minRows={2}
            size="small"
            fullWidth
            disabled={isSaving}
            error={Boolean(errors.notes)}
            helperText={errors.notes?.message}
            {...register("notes")}
          />

          <BlockItemList lookups={{ exercises: lookups.exercises }} isLoading={isSaving} />
        </Stack>
      </EditPanel>
    </FormProvider>
  );
};
