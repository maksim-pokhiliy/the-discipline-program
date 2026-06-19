import { type Result, resultSchema } from "@repo/contracts/lms/_shared";
import {
  type BenchmarkDelta,
  type BenchmarkRecordView,
  type OneRMRecordView,
  type RecordsViewResponse,
} from "@repo/contracts/lms/records-view";

import { ONE_RM_RECORD_SOURCE_MAP } from "../../../mappers/lms";
import {
  type BenchmarkResultEntry,
  buildResultSeries,
  deriveBestResult,
  isNewPR,
} from "../athlete-records";

import { buildSubline, resolveBenchmarkTitle } from "./build-records-view.helpers";
import { type OneRMRecordRecord, type RecordsBenchmarkResultRecord } from "./records-view.types";

type NonEmptyArray<T> = [T, ...T[]];

const METERS_PER_KM = 1000;

const distanceToMeters = (result: Extract<Result, { type: "distance" }>): number =>
  result.unit === "km" ? result.value * METERS_PER_KM : result.value;

const groupBy = <T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, NonEmptyArray<T>> => {
  const groups = new Map<K, NonEmptyArray<T>>();

  for (const item of items) {
    const key = keyOf(item);
    const existing = groups.get(key);

    if (existing === undefined) {
      groups.set(key, [item]);
    } else {
      existing.push(item);
    }
  }

  return groups;
};

const lastOf = <T>(items: NonEmptyArray<T>): T => items[items.length - 1] ?? items[0];

const priorOf = <T>(items: NonEmptyArray<T>): T | undefined =>
  items.length < 2 ? undefined : items[items.length - 2];

const ensureNonEmpty = <T>(items: readonly T[], fallback: NonEmptyArray<T>): NonEmptyArray<T> => {
  const [first, ...rest] = items;

  return first === undefined ? fallback : [first, ...rest];
};

const mapNonEmpty = <T, R>(items: NonEmptyArray<T>, mapper: (item: T) => R): NonEmptyArray<R> => {
  const [first, ...rest] = items;

  return [mapper(first), ...rest.map(mapper)];
};

const sortByRecordedAtAsc = <T extends { recordedAt: Date }>(
  rows: NonEmptyArray<T>,
): NonEmptyArray<T> => {
  const [first, ...rest] = [...rows].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
  );

  return first === undefined ? rows : [first, ...rest];
};

const build1RMRecord = (
  exerciseId: string,
  rows: NonEmptyArray<OneRMRecordRecord>,
): OneRMRecordView => {
  const ordered = sortByRecordedAtAsc(rows);
  const best = ordered.reduce(
    (max, row) => Math.max(max, Number(row.valueKg)),
    Number(ordered[0].valueKg),
  );
  const bestRow = ordered.find((row) => Number(row.valueKg) === best) ?? ordered[0];
  const latest = lastOf(ordered);
  const prior = priorOf(ordered);

  return {
    exerciseId,
    exerciseName: ordered[0].exercise.canonicalName,
    best,
    bestSource: ONE_RM_RECORD_SOURCE_MAP[bestRow.source],
    bestRecordedAt: bestRow.recordedAt.toISOString(),
    lastRecordedAt: latest.recordedAt.toISOString(),
    delta: prior === undefined ? 0 : Number(latest.valueKg) - Number(prior.valueKg),
    recordCount: ordered.length,
    series: ordered.map((row) => ({
      valueKg: Number(row.valueKg),
      source: ONE_RM_RECORD_SOURCE_MAP[row.source],
      recordedAt: row.recordedAt.toISOString(),
      isBest: row === bestRow,
    })),
  };
};

const build1RMSection = (rows: OneRMRecordRecord[]): OneRMRecordView[] =>
  [...groupBy(rows, (row) => row.exerciseId).entries()]
    .map(([exerciseId, group]) => build1RMRecord(exerciseId, group))
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

const magnitudeVector = (result: Result): number[] => {
  switch (result.type) {
    case "time":
      return [result.seconds];
    case "rounds_reps":
      return [result.rounds, result.reps];
    case "load":
      return [result.kg];
    case "max_reps":
      return [result.reps];
    case "distance":
      return [distanceToMeters(result)];
    case "calories":
      return [result.value];
    default:
      result satisfies never;

      return [];
  }
};

const resultMagnitude = (prior: Result, latest: Result): number => {
  if (prior.type !== latest.type) {
    return 0;
  }

  const priorVector = magnitudeVector(prior);
  const latestVector = magnitudeVector(latest);

  for (let index = 0; index < latestVector.length; index++) {
    const difference = (latestVector[index] ?? 0) - (priorVector[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
};

const ROUNDS_REPS_SCALE = 1000;

const resultScalar = (result: Result): number => {
  switch (result.type) {
    case "time":
      return result.seconds;
    case "rounds_reps":
      return result.rounds * ROUNDS_REPS_SCALE + result.reps;
    case "load":
      return result.kg;
    case "max_reps":
      return result.reps;
    case "distance":
      return distanceToMeters(result);
    case "calories":
      return result.value;
    default:
      result satisfies never;

      return 0;
  }
};

const benchmarkDelta = (entries: NonEmptyArray<BenchmarkResultEntry>): BenchmarkDelta | null => {
  const prior = priorOf(entries);
  const latest = lastOf(entries);

  if (prior === undefined) {
    return null;
  }

  return {
    value: resultMagnitude(prior.result, latest.result),
    improved: isNewPR(prior.result, latest.result),
  };
};

const buildBenchmarkRecord = (
  plannedSchemaId: string,
  rows: NonEmptyArray<RecordsBenchmarkResultRecord>,
): BenchmarkRecordView => {
  const entries = mapNonEmpty(rows, (row) => ({
    result: resultSchema.parse(row.result),
    recordedAt: row.recordedAt,
  }));
  const ordered = ensureNonEmpty(buildResultSeries(entries), entries);
  const best = deriveBestResult(ordered) ?? ordered[0].result;
  const bestEntry = ordered.find((entry) => entry.result === best) ?? ordered[0];
  const resultType = best.type;
  const schema = rows[0].plannedSchema;

  return {
    plannedSchemaId,
    title: resolveBenchmarkTitle(schema, plannedSchemaId),
    subline: buildSubline(schema, resultType),
    resultType,
    best,
    bestRecordedAt: bestEntry.recordedAt.toISOString(),
    lastRecordedAt: lastOf(ordered).recordedAt.toISOString(),
    delta: benchmarkDelta(ordered),
    series: ordered.map((entry) => ({
      result: entry.result,
      scalar: resultScalar(entry.result),
      recordedAt: entry.recordedAt.toISOString(),
      isBest: entry === bestEntry,
    })),
    attemptCount: ordered.length,
  };
};

const buildBenchmarkSection = (rows: RecordsBenchmarkResultRecord[]): BenchmarkRecordView[] =>
  [...groupBy(rows, (row) => row.plannedSchemaId).entries()]
    .map(([plannedSchemaId, group]) => buildBenchmarkRecord(plannedSchemaId, group))
    .sort((a, b) => a.title.localeCompare(b.title));

type BuildRecordsViewArgs = {
  oneRMRows: OneRMRecordRecord[];
  benchmarkRows: RecordsBenchmarkResultRecord[];
};

export const buildRecordsView = ({
  oneRMRows,
  benchmarkRows,
}: BuildRecordsViewArgs): RecordsViewResponse => ({
  oneRM: build1RMSection(oneRMRows),
  benchmarks: buildBenchmarkSection(benchmarkRows),
});
