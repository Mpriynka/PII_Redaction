/**
 * Regex-based PII detection — Stage 1 of the pipeline.
 * Fast pattern matching for well-structured PII patterns.
 */

import type { PIIType } from "./mock-data";

export interface RegexMatch {
  type: PIIType;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

const PATTERNS: { type: PIIType; pattern: RegExp; confidence: number }[] = [
  // Email
  { type: "email", pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, confidence: 0.95 },
  // SSN (xxx-xx-xxxx)
  { type: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, confidence: 0.95 },
  // Phone (various US formats)
  { type: "phone", pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, confidence: 0.9 },
  // Credit card (basic: 13-19 digit groups)
  { type: "financial", pattern: /\b(?:\d[ -]*?){13,19}\b/g, confidence: 0.7 },
  // Date patterns (MM/DD/YYYY, YYYY-MM-DD, Month DD, YYYY)
  { type: "date", pattern: /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4})\b/gi, confidence: 0.85 },
  // URL
  { type: "id", pattern: /\b(?:https?:\/\/|www\.)[\w\-]+\.[\w\-.~:/?#[\]@!$&'()*+,;=]+(?:\b|$)/gi, confidence: 0.85 },
  // MAC address
  { type: "id", pattern: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g, confidence: 0.9 },
  // UUID
  { type: "id", pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, confidence: 0.9 },
  // IPv6 address
  { type: "id", pattern: /\[([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\]/g, confidence: 0.9 },
  // IPv4 address
  { type: "id", pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, confidence: 0.9 },

];

export function detectWithRegex(text: string): RegexMatch[] {
  const results: RegexMatch[] = [];

  for (const { type, pattern, confidence } of PATTERNS) {
    // Reset lastIndex for each run
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      results.push({
        type,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence,
      });
    }
  }

  // Sort by start index
  results.sort((a, b) => a.start - b.start);
  return results;
}
