import { type ExerciseCatalogEntry } from "../../canonical-schema.js";

import { exerciseCuid } from "./cuid.js";

/**
 * Source text → canonical exercise cuid resolver.
 *
 * Source rows mention exercises in various casing and prefix forms
 * ("DB Thrusters" / "db thrusters") and with leading rep counts
 * ("10 DB bench presses"). This resolver normalises and matches against
 * the canonical catalog (149 entries) with aliases.
 *
 * If a source exercise name cannot be matched, the resolver registers an
 * ad-hoc catalog entry (best-effort attributes) and flags it in
 * `unmatched`. Session A surfaces these for the orchestrator.
 */
export class ExerciseResolver {
  private nameIndex = new Map<string, ExerciseCatalogEntry>();
  private entries: ExerciseCatalogEntry[];
  private adhocCount = 0;
  public unmatchedReports: { sourceText: string; createdRef: string }[] = [];

  constructor(initial: ExerciseCatalogEntry[]) {
    this.entries = [...initial];
    for (const e of initial) {
      this.register(e);
    }
  }

  private register(entry: ExerciseCatalogEntry): void {
    const keys = new Set<string>();

    keys.add(this.normalise(entry.canonicalName));
    for (const a of entry.aliases) {
      keys.add(this.normalise(a));
    }
    for (const k of keys) {
      this.nameIndex.set(k, entry);
    }
  }

  private normalise(text: string): string {
    return text.toLowerCase().replace(/\s+/g, " ").replace(/[.,;]/g, "").trim();
  }

  /** Strip leading rep count + obvious bracket annotations to expose exercise name. */
  stripLeadingCount(text: string): { count: string | null; remainder: string } {
    const m = text.match(/^(\d+(?:-\d+)?)\s+(.*)$/);

    if (!m) {
      return { count: null, remainder: text };
    }

    return { count: m[1]!, remainder: m[2]! };
  }

  stripAllBrackets(text: string): string {
    return text
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Resolve source-text fragment (one exercise name, no annotations) to catalog ref. */
  resolve(sourceName: string): string {
    const cleaned = this.stripAllBrackets(sourceName).trim();

    if (!cleaned) {
      return this.sharedUnspecifiedRef();
    }

    const key = this.normalise(cleaned);
    const direct = this.nameIndex.get(key);

    if (direct) {
      return direct.ref;
    }

    // try original raw
    const rawKey = this.normalise(sourceName);
    const raw = this.nameIndex.get(rawKey);

    if (raw) {
      return raw.ref;
    }

    return this.registerAdhoc(cleaned);
  }

  private unspecifiedRef: string | null = null;
  private sharedUnspecifiedRef(): string {
    if (this.unspecifiedRef) {
      return this.unspecifiedRef;
    }

    const entry: ExerciseCatalogEntry = {
      ref: exerciseCuid("(unspecified-exercise-element)"),
      canonicalName: "(unspecified exercise element)",
      primaryEquipment: "UNKNOWN",
      movementTypeTagPrimary: "UNKNOWN",
      movementTypeTagSecondary: null,
      defaultDemoUrls: [],
      canonicalCompoundType: "ATOMIC",
      placeholderFlag: false,
      movementFamily: null,
      aliases: [],
      notes:
        "Sentinel — emitted when a compound element resolved to empty source text after bracket strip. Session A may want to replace with a typed slot.",
    };

    this.entries.push(entry);
    this.register(entry);
    this.unspecifiedRef = entry.ref;

    return entry.ref;
  }

  /** Public: look up but DON'T create — returns null if not found. */
  lookup(sourceName: string): string | null {
    const cleaned = this.stripAllBrackets(sourceName).trim();
    const key = this.normalise(cleaned);
    const direct = this.nameIndex.get(key);

    if (direct) {
      return direct.ref;
    }

    return null;
  }

  private registerAdhoc(name: string): string {
    this.adhocCount += 1;
    const cleaned = name || `adhoc-exercise-${this.adhocCount}`;
    const entry: ExerciseCatalogEntry = {
      ref: exerciseCuid(`adhoc::${cleaned}`),
      canonicalName: cleaned,
      primaryEquipment: "UNKNOWN",
      movementTypeTagPrimary: "UNKNOWN",
      movementTypeTagSecondary: null,
      defaultDemoUrls: [],
      canonicalCompoundType: "ATOMIC",
      placeholderFlag: false,
      movementFamily: null,
      aliases: [],
      notes: `Adhoc — source fragment did not match any canonical exercise. Created by Session B for unbreakable cross-reference.`,
    };

    this.entries.push(entry);
    this.register(entry);
    this.unmatchedReports.push({ sourceText: name, createdRef: entry.ref });

    return entry.ref;
  }

  catalog(): ExerciseCatalogEntry[] {
    return this.entries;
  }
}
