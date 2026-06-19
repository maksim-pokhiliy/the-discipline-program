import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  athleteProfile: endpoints.createAthleteProfileAPI(client),
  athleteSessionView: endpoints.createAthleteSessionViewAPI(client),
  blocks: endpoints.createBlocksAPI(client),
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachCredentials: endpoints.createCoachCredentialAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachInvite: endpoints.createCoachInviteAPI(client),
  coachNotes: endpoints.createCoachNotesAPI(client),
  coachProfile: endpoints.createCoachProfileAPI(client),
  dayMetadata: endpoints.createDayMetadataAPI(client),
  exercises: endpoints.createExercisesAPI(client),
  groups: endpoints.createGroupsAPI(client),
  labels: endpoints.createLabelsAPI(client),
  modifiers: endpoints.createModifiersAPI(client),
  benchmarkResults: endpoints.createBenchmarkResultsAPI(client),
  oneRMRecords: endpoints.createOneRMRecordsAPI(client),
  performedSessions: endpoints.createPerformedSessionsAPI(client),
  planTimetable: endpoints.createPlanTimetableAPI(client),
  rowGroups: endpoints.createRowGroupsAPI(client),
  schemaRows: endpoints.createSchemaRowsAPI(client),
  schemas: endpoints.createSchemasAPI(client),
  sessions: endpoints.createSessionsAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  upload: endpoints.createUploadAPI(client),
  users: endpoints.createUsersAPI(client),
  weeks: endpoints.createWeeksAPI(client),
});

export const api = createApi(browserApiClient);
