import { NotFoundError } from "@repo/errors";

type ToggleExclusiveFeaturedConfig<TRaw extends { isFeatured: boolean }, TMapped> = {
  find: () => Promise<TRaw | null>;
  unfeatureOthers: () => Promise<unknown>;
  update: (isFeatured: boolean) => Promise<TRaw>;
  map: (raw: TRaw) => TMapped;
  entityName: string;
  id: string;
};

export const toggleExclusiveFeatured = async <TRaw extends { isFeatured: boolean }, TMapped>({
  find,
  unfeatureOthers,
  update,
  map,
  entityName,
  id,
}: ToggleExclusiveFeaturedConfig<TRaw, TMapped>): Promise<TMapped> => {
  const entity = await find();

  if (!entity) {
    throw new NotFoundError(`${entityName} not found`, { id });
  }

  const newValue = !entity.isFeatured;

  if (newValue) {
    await unfeatureOthers();
  }

  const updated = await update(newValue);

  return map(updated);
};
