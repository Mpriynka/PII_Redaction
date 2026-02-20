/**
 * ML-based PII detection — Stage 2 of the pipeline.
 * Uses a quantized DistilBERT ONNX model via @huggingface/transformers.
 * 
 * Refactored to use the high-level `pipeline` API with `aggregation_strategy="simple"`
 * to automatically handle BIO grouping and merging.
 */

import {
  pipeline,
  env,
  type Pipeline
} from "@huggingface/transformers";
import type { PIIType } from "./mock-data";

// Disable remote model hub — load only from our public folder
env.allowRemoteModels = false;
env.allowLocalModels = true;

let classifier: any = null; // Typing as any because Pipeline type can be tricky in some versions
let loadingPromise: Promise<void> | null = null;

// Helper to check if model is ready
export function isModelLoaded(): boolean {
  return classifier !== null;
}

/**
 * Map model NER labels (without B-/I- prefix) to our PIIType categories.
 * Adjust this mapping based on your labels.json content.
 */
const LABEL_TO_PII_TYPE: Record<string, PIIType> = {
  // Names
  FIRSTNAME: "name",
  LASTNAME: "name",
  MIDDLENAME: "name",
  GIVENNAME: "name",
  GIVENNAME1: "name",
  GIVENNAME2: "name",
  LASTNAME1: "name",
  LASTNAME2: "name",
  LASTNAME3: "name",
  PREFIX: "name",
  USERNAME: "id", // Or name
  NAME: "name",

  // Email
  EMAIL: "email",

  // Phone
  PHONE_NUM: "phone",
  PHONE: "phone",
  TEL: "phone",

  // SSN
  SSN: "ssn",
  SOCIALNUMBER: "ssn",

  // Address
  STREETADDRESS: "address",
  STREET: "address",
  CITY: "address",
  STATE: "address",
  ZIPCODE: "address",
  POSTCODE: "address",
  COUNTY: "address",
  BUILDINGNAME: "address",
  BUILDING: "address",
  SECONDARYADDRESS: "address",
  SECADDRESS: "address",
  NEARBYGPSCOORDINATE: "address",
  GEOCOORD: "address",
  ADDRESS: "address",
  COUNTRY: "address",

  // Date
  DATE: "date",
  DOB: "date",
  BOD: "date",
  TIME: "date",

  // Financial
  CREDITCARDNUMBER: "financial",
  CREDITCARDCVV: "financial",
  CREDITCARDISSUER: "financial",
  CARDISSUER: "financial",
  IBAN: "financial",
  ACCOUNTNUMBER: "financial",
  ACCOUNTNAME: "financial",
  BITCOINADDRESS: "financial",
  PIN: "financial",

  // ID / Other
  DRIVERLICENSENUMBER: "id",
  DRIVERLICENSE: "id",
  VEHICLEIDENTIFICATIONNUMBER: "id",
  VEHICLEREGISTRATIONNUMBER: "id",
  IPV4: "id",
  IPV6: "id",
  IP: "id",
  PASSWORD: "id",
  PASS: "id",
  PASSPORT: "id",
  IDCARD: "id",
  URL: "id",
  COMPANYNAME: "id",
  JOBTITLE: "id",
  TITLE: "id",
  JOBAREA: "id",
  AGE: "id",
  GENDER: "id",
  SEX: "id",
  ID: "id",
};

export type ModelLoadProgress = {
  status: string;
  progress: number; // 0-100
  file?: string;
};

export async function loadModel(
  onProgress?: (p: ModelLoadProgress) => void
): Promise<void> {
  if (isModelLoaded()) return;

  if (loadingPromise) {
    await loadingPromise;
    return;
  }

  loadingPromise = (async () => {
    try {
      onProgress?.({ status: "Initializing...", progress: 5 });

      // Use relative path to avoid "remote" issues - this will be resolved relative to current origin
      // Note: transformers.js pipeline takes the model path string.
      const baseUrl = import.meta.env.BASE_URL || "/";
      const modelPath = `${baseUrl}models/pii-model`.replace("//", "/");

      // Load using pipeline directly - simpler and handles tokenizer+model together
      onProgress?.({ status: "Loading model & tokenizer...", progress: 10 });

      classifier = await pipeline("token-classification", modelPath, {
        quantized: true,

        // Progress callback for both tokenizer and model files
        progress_callback: (data: any) => {
          if (data.status === "progress" && data.progress != null) {
            onProgress?.({
              status: `Downloading ${data.file || "model"}...`,
              progress: Math.round(data.progress),
              file: data.file,
            });
          }
        }
      });

      onProgress?.({ status: "Ready!", progress: 100 });
    } catch (err) {
      loadingPromise = null;
      classifier = null;
      throw err;
    }
  })();

  await loadingPromise;
}

export interface MLMatch {
  type: PIIType;
  text: string;
  start: number; // Global start index
  end: number;   // Global end index
  confidence: number;
  rawLabel: string; // e.g. "B-FIRSTNAME"
}

/**
 * Split text into overlapping chunks of ~400 chars to handle >512 tokens
 */
function chunkText(text: string, maxChars = 400, overlap = 50): Array<{ chunk: string; offset: number }> {
  if (text.length <= maxChars) return [{ chunk: text, offset: 0 }];

  const chunks: Array<{ chunk: string; offset: number }> = [];
  let pos = 0;

  while (pos < text.length) {
    let end = Math.min(pos + maxChars, text.length);

    if (end < text.length) {
      const breakAt = text.lastIndexOf("\n", end);
      if (breakAt > pos + overlap) {
        end = breakAt + 1;
      } else {
        const spaceAt = text.lastIndexOf(" ", end);
        if (spaceAt > pos + overlap) {
          end = spaceAt + 1;
        }
      }
    }

    chunks.push({ chunk: text.slice(pos, end), offset: pos });

    // Critical fix: Stop if reached end
    if (end >= text.length) break;

    pos = end - overlap;
  }

  return chunks;
}

/**
 * Run inference on a text chunk using pipeline with aggregation
 */
async function detectChunk(textChunk: string, chunkOffset: number): Promise<MLMatch[]> {
  if (!classifier) return [];

  // Use aggregation_strategy="simple" to merge B- I- tags automatically
  const rawResults = await classifier(textChunk, {
    aggregation_strategy: "simple",
    ignore_labels: ["O"]
  });

  // rawResults is array of { entity_group: string, score: number, word: string, start: number, end: number }
  console.log("Raw classifier results for chunk:", rawResults);
  if (rawResults.length > 0) {
    console.log("First item sample:", rawResults[0]);
  }

  let searchPos = 0;

  return (rawResults as any[]).map(r => {
    // Normalize label: "STREET_ADDRESS" -> "STREETADDRESS"
    // The pipeline simple strategy might produce `entity_group` or `entity` depending on version/config
    const label = r.entity_group || r.entity || r.label || "";

    if (!label) {
      console.warn("Unexpected entity format (missing label):", r);
      return null;
    }

    // Strip B- and I- prefixes before matching against our mappings
    let normalizedLabel = label.toUpperCase();
    if (normalizedLabel.startsWith("B-") || normalizedLabel.startsWith("I-")) {
      normalizedLabel = normalizedLabel.substring(2);
    }
    const labelName = normalizedLabel.replace(/[^A-Z]/g, "");

    // First try the normalized label name without non-alpha chars (e.g. STREETADDRESS)
    // Then try the raw stripped label (e.g. STREET_ADDRESS)
    // Then try the original raw label directly just in case
    const type = LABEL_TO_PII_TYPE[labelName] || LABEL_TO_PII_TYPE[normalizedLabel] || LABEL_TO_PII_TYPE[label];

    if (!type) {
      console.warn("Unknown label skipped:", label, "-> normalized:", labelName);
      return null;
    }

    let start = r.start;
    let end = r.end;

    // Fallback if the pipeline didn't return character offsets (e.g. no fast tokenizer)
    if (typeof start !== "number" || isNaN(start)) {
      const cleanWord = r.word ? r.word.replace(/^##/, "") : "";
      if (!cleanWord) return null;

      start = textChunk.indexOf(cleanWord, searchPos);
      if (start === -1) {
        // Try from the beginning of chunk if missed
        start = textChunk.indexOf(cleanWord);
        if (start === -1) return null;
      }
      end = start + cleanWord.length;
      searchPos = end; // advance search pos for next token
    }

    return {
      type,
      // Use slice from chunk to preserve original whitespace/newlines
      text: textChunk.slice(start, end),
      start: start + chunkOffset,
      end: end + chunkOffset,
      confidence: r.score, // Correct probability from pipeline
      rawLabel: label
    };
  }).filter((x): x is MLMatch => x !== null);
}

/**
 * Main detection entry point
 */
export async function detectWithModel(text: string): Promise<MLMatch[]> {
  if (!classifier) {
    throw new Error("Model not loaded. Call loadModel() first.");
  }

  const chunks = chunkText(text);
  const allEntities: MLMatch[] = [];

  for (const { chunk, offset } of chunks) {
    const chunkEntities = await detectChunk(chunk, offset);
    allEntities.push(...chunkEntities);
  }

  // Deduplicate overlapping entities from chunk boundaries
  if (allEntities.length === 0) return [];

  // Sort by start index
  allEntities.sort((a, b) => a.start - b.start);

  const deduped: MLMatch[] = [];
  let current = allEntities[0];

  for (let i = 1; i < allEntities.length; i++) {
    const next = allEntities[i];

    // Check for overlap or adjacency (e.g., within 2 chars for spaces between names/tokens)
    if (next.start <= current.end + 2) {
      // If same type, merge them!
      if (current.type === next.type) {
        current.end = Math.max(current.end, next.end);
        // We need original text to slice, but we don't have it easily.
        // We can just rely on the `text` field not being fully accurate if merged, 
        // OR we can pass `text` from `detectWithModel` to slice it properly.
        current.text = text.slice(current.start, current.end);
        current.confidence = Math.max(current.confidence, next.confidence);
      } else {
        // Different type but overlapping? Pick better confidence.
        // If they are just adjacent but different type, keep both.
        if (next.start < current.end) { // This condition is already covered by next.start <= current.end + 2, but specifically for overlap
          const currLen = current.end - current.start;
          const nextLen = next.end - next.start;

          if (nextLen > currLen) {
            current = next;
          } else if (nextLen === currLen && next.confidence > current.confidence) {
            current = next;
          }
        } else { // Adjacent but different type, so push current and move to next
          deduped.push(current);
          current = next;
        }
      }
    } else {
      deduped.push(current);
      current = next;
    }
  }
  deduped.push(current);

  return deduped;
}

export function unloadModel() {
  classifier = null; // dispose
  loadingPromise = null;
}
