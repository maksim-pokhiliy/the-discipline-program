import {
  cleanupRaw,
  createTestCoach,
  createTestExercise,
  createTestPlan,
} from "../../../test/helpers";

import { type CloneFixtureCatalog } from "./clone-fixture";

type Coach = Awaited<ReturnType<typeof createTestCoach>>;

export type CloneSuiteContext = {
  owner: Coach;
  otherCoach: Coach;
  headCoach: Coach;
  activePlanId: string;
  archivedPlanId: string;
  catalog: CloneFixtureCatalog;
};

const demotePreexistingHeadCoaches = async (): Promise<void> => {
  const preexisting = await cleanupRaw.user.findMany({
    where: { role: "HEAD_COACH" },
    select: { id: true },
  });

  for (const headCoach of preexisting) {
    await cleanupRaw.user.update({ where: { id: headCoach.id }, data: { role: "COACH" } });
  }
};

const createLabel = async (prefix: string, applicableLevels: string[]): Promise<string> => {
  const unique = crypto.randomUUID().slice(0, 8);
  const label = await cleanupRaw.label.create({
    data: {
      name: `${prefix} ${unique}`,
      nameLower: `${prefix.toLowerCase()} ${unique}`,
      applicableLevels,
    },
  });

  return label.id;
};

const createModifier = async (prefix: string): Promise<string> => {
  const unique = crypto.randomUUID().slice(0, 8);
  const modifier = await cleanupRaw.modifier.create({
    data: { name: `${prefix} ${unique}`, nameLower: `${prefix.toLowerCase()} ${unique}` },
  });

  return modifier.id;
};

export const setupCloneSuite = async (): Promise<CloneSuiteContext> => {
  const owner = await createTestCoach();
  const otherCoach = await createTestCoach();
  const headCoach = await createTestCoach();

  await demotePreexistingHeadCoaches();
  await cleanupRaw.user.update({ where: { id: headCoach.user.id }, data: { role: "HEAD_COACH" } });

  const activePlan = await createTestPlan(owner.user.id, { status: "ACTIVE" });
  const archivedPlan = await createTestPlan(owner.user.id, { status: "ARCHIVED" });
  const exercise = await createTestExercise();

  const catalog: CloneFixtureCatalog = {
    exerciseId: exercise.id,
    modifierAId: await createModifier("Clone Modifier A"),
    modifierBId: await createModifier("Clone Modifier B"),
    dayLabelId: await createLabel("Clone Day Label", ["DAY"]),
    sessionLabelId: await createLabel("Clone Session Label", ["SESSION"]),
    blockLabelId: await createLabel("Clone Block Label", ["BLOCK"]),
  };

  return {
    owner,
    otherCoach,
    headCoach,
    activePlanId: activePlan.id,
    archivedPlanId: archivedPlan.id,
    catalog,
  };
};

export const teardownCloneSuite = async (context: CloneSuiteContext): Promise<void> => {
  const planIds = [context.activePlanId, context.archivedPlanId];
  const scope = { schema: { block: { session: { day: { week: { planId: { in: planIds } } } } } } };

  await cleanupRaw.rowModifierAssignment.deleteMany({ where: { row: scope } }).catch(() => {});
  await cleanupRaw.schemaRow.deleteMany({ where: scope }).catch(() => {});
  await cleanupRaw.rowGroup.deleteMany({ where: scope }).catch(() => {});
  await cleanupRaw.blockLabelAssignment
    .deleteMany({ where: { block: { session: { day: { week: { planId: { in: planIds } } } } } } })
    .catch(() => {});
  await cleanupRaw.schema
    .deleteMany({ where: { block: { session: { day: { week: { planId: { in: planIds } } } } } } })
    .catch(() => {});
  await cleanupRaw.schemaGroup
    .deleteMany({ where: { block: { session: { day: { week: { planId: { in: planIds } } } } } } })
    .catch(() => {});
  await cleanupRaw.block
    .deleteMany({ where: { session: { day: { week: { planId: { in: planIds } } } } } })
    .catch(() => {});
  await cleanupRaw.session
    .deleteMany({ where: { day: { week: { planId: { in: planIds } } } } })
    .catch(() => {});
  await cleanupRaw.day.deleteMany({ where: { week: { planId: { in: planIds } } } }).catch(() => {});
  await cleanupRaw.week.deleteMany({ where: { planId: { in: planIds } } }).catch(() => {});

  await cleanupRaw.trainingPlan.deleteMany({ where: { id: { in: planIds } } }).catch(() => {});

  await cleanupRaw.label
    .deleteMany({
      where: {
        id: {
          in: [
            context.catalog.dayLabelId,
            context.catalog.sessionLabelId,
            context.catalog.blockLabelId,
          ],
        },
      },
    })
    .catch(() => {});
  await cleanupRaw.modifier
    .deleteMany({
      where: { id: { in: [context.catalog.modifierAId, context.catalog.modifierBId] } },
    })
    .catch(() => {});
  await cleanupRaw.exercise.delete({ where: { id: context.catalog.exerciseId } }).catch(() => {});

  await cleanupRaw.coachProfile
    .deleteMany({
      where: {
        id: {
          in: [
            context.owner.profile.id,
            context.otherCoach.profile.id,
            context.headCoach.profile.id,
          ],
        },
      },
    })
    .catch(() => {});
  await cleanupRaw.user
    .deleteMany({
      where: {
        id: { in: [context.owner.user.id, context.otherCoach.user.id, context.headCoach.user.id] },
      },
    })
    .catch(() => {});
};
