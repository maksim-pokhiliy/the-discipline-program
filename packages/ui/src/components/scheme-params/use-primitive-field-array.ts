import {
  type Control,
  type FieldArrayPath,
  type FieldPath,
  type FieldValues,
  useFieldArray,
} from "react-hook-form";

type PrimitiveFieldArrayReturn = {
  fields: ReadonlyArray<{ id: string }>;
  append: (value: number) => void;
  remove: (index: number) => void;
};

type UsePrimitiveFieldArrayArgs<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

export const usePrimitiveFieldArray = <TFieldValues extends FieldValues>({
  control,
  name,
}: UsePrimitiveFieldArrayArgs<TFieldValues>): PrimitiveFieldArrayReturn => {
  const { fields, append, remove } = useFieldArray<TFieldValues>({
    control,
    name: name as FieldArrayPath<TFieldValues>,
  });

  return {
    fields,
    append: (value) => {
      const appendValue = value as Parameters<typeof append>[0];

      append(appendValue);
    },
    remove,
  };
};
