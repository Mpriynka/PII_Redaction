/**
 * Unified PII detection pipeline: Regex & ML Model
 * Currently separated for debugging purposes. Proper merging logic will be added later.
 */

import { detectWithRegex, type RegexMatch } from "./regex-pii";
import { detectWithModel, isModelLoaded, type MLMatch } from "./ml-pii";
import type { PIIEntity, PIIType } from "./mock-data";

let entityCounter = 0;

const TYPE_COUNTERS: Record<string, number> = {};

function nextReplacement(type: PIIType): string {
  const label = type.toUpperCase();
  TYPE_COUNTERS[label] = (TYPE_COUNTERS[label] || 0) + 1;
  return `[${label}_${TYPE_COUNTERS[label]}]`;
}

function resetCounters() {
  entityCounter = 0;
  for (const key of Object.keys(TYPE_COUNTERS)) {
    delete TYPE_COUNTERS[key];
  }
}

/**
 * Check if two spans overlap
 */
function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Merge regex and ML results strictly ensuring no overlaps for UI rendering.
 */
function mergeResults(
  regexMatches: RegexMatch[],
  mlMatches: MLMatch[]
): Array<{ type: PIIType; text: string; start: number; end: number; source: "regex" | "ml" }> {
  const allMatches: Array<{ type: PIIType; text: string; start: number; end: number; source: "regex" | "ml" }> = [];

  for (const r of regexMatches) {
    if (isNaN(r.start) || isNaN(r.end)) continue;
    allMatches.push({ type: r.type, text: r.text, start: r.start, end: r.end, source: "regex" });
  }

  for (const m of mlMatches) {
    if (isNaN(m.start) || isNaN(m.end)) continue;
    allMatches.push({ type: m.type, text: m.text, start: m.start, end: m.end, source: "ml" });
  }

  // Sort primarily by length (descending) to greedily take the longest match
  allMatches.sort((a, b) => {
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenA === lenB) {
      // If lengths are equal, prefer regex
      if (a.source === "regex" && b.source !== "regex") return -1;
      if (b.source === "regex" && a.source !== "regex") return 1;
      return a.start - b.start;
    }
    return lenB - lenA;
  });

  const finalMerged: typeof allMatches = [];
  for (const m of allMatches) {
    const hasOverlap = finalMerged.some((f) => overlaps(f, m));
    if (!hasOverlap) {
      finalMerged.push(m);
    }
  }

  // Finally, put them back into chronological start order
  finalMerged.sort((a, b) => a.start - b.start);
  return finalMerged;
}

export interface PipelineResult {
  regexEntities: PIIEntity[];
  mlEntities: PIIEntity[];
  entities: PIIEntity[];
  stats: {
    regexCount: number;
    mlCount: number;
    totalCount: number;
    durationMs: number;
  };
}

/**
 * Run the full PII detection pipeline on the given text.
 */
export async function runPipeline(text: string): Promise<PipelineResult> {
  resetCounters();
  const startTime = performance.now();

  // Stage 1: Regex
  const regexMatches = detectWithRegex(text);

  // Stage 2: ML Model (if loaded)
  let mlMatches: MLMatch[] = [];
  if (isModelLoaded()) {
    try {
      mlMatches = await detectWithModel(text);
      console.log("ML Matches:", mlMatches);
      console.log("Regex Matches:", regexMatches);
      console.log("Merged Matches:", mergeResults(regexMatches, mlMatches));
    } catch (err) {
      console.warn("ML model inference failed, falling back to regex-only:", err);
    }
  }

  const regexEntities: PIIEntity[] = regexMatches.map((m, i) => ({
    id: `regex-${i + 1}`,
    type: m.type,
    original: m.text,
    replacement: nextReplacement(m.type),
    startIndex: m.start,
    endIndex: m.end,
    accepted: null,
  }));

  const mlEntities: PIIEntity[] = mlMatches.map((m, i) => ({
    id: `ml-${i + 1}`,
    type: m.type,
    original: m.text,
    replacement: nextReplacement(m.type),
    startIndex: m.start,
    endIndex: m.end,
    accepted: null,
  }));

  // Create the final merged, non-overlapping entities array for the UI
  const merged = mergeResults(regexMatches, mlMatches);
  const entities: PIIEntity[] = merged.map((m, i) => ({
    id: String(i + 1),
    type: m.type,
    original: m.text,
    replacement: nextReplacement(m.type),
    startIndex: m.start,
    endIndex: m.end,
    accepted: null,
  }));

  const durationMs = Math.round(performance.now() - startTime);

  return {
    regexEntities,
    mlEntities,
    entities,
    stats: {
      regexCount: regexEntities.length,
      mlCount: mlEntities.length,
      totalCount: entities.length,
      durationMs,
    },
  };
}
