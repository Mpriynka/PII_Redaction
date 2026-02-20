export type PIIType = "name" | "email" | "phone" | "ssn" | "address" | "date" | "financial" | "id";

export interface PIIEntity {
  id: string;
  type: PIIType;
  original: string;
  replacement: string;
  startIndex: number;
  endIndex: number;
  accepted: boolean | null; // null = pending, true = accepted, false = rejected
}

export const PII_COLORS: Record<PIIType, string> = {
  name: "pii-name",
  email: "pii-email",
  phone: "pii-phone",
  ssn: "pii-ssn",
  address: "pii-address",
  date: "pii-date",
  financial: "pii-financial",
  id: "pii-id",
};

export const PII_LABELS: Record<PIIType, string> = {
  name: "Person Name",
  email: "Email Address",
  phone: "Phone Number",
  ssn: "SSN",
  address: "Address",
  date: "Date / Time",
  financial: "Financial",
  id: "Identifier",
};

export const SAMPLE_TEXT = `Dear Mr. John Smith,

Thank you for your application dated March 15, 1990. We have reviewed your submission and would like to schedule a follow-up interview.

Your contact information on file:
- Email: john.smith@example.com
- Phone: (555) 123-4567
- SSN: 123-45-6789
- Address: 1234 Oak Street, Springfield, IL 62701

We also received the reference from Jane Doe (jane.doe@company.org, (555) 987-6543) and Michael Johnson at michael.j@enterprise.net.

Please confirm your availability by contacting our HR department at hr@corporation.com or calling (555) 000-1111.

Best regards,
Sarah Williams
Human Resources Director`;

export const SAMPLE_ENTITIES: PIIEntity[] = [
  { id: "1", type: "name", original: "John Smith", replacement: "[NAME_1]", startIndex: 9, endIndex: 19, accepted: null },
  { id: "2", type: "date", original: "March 15, 1990", replacement: "[DATE_1]", startIndex: 64, endIndex: 78, accepted: null },
  { id: "3", type: "email", original: "john.smith@example.com", replacement: "[EMAIL_1]", startIndex: 189, endIndex: 211, accepted: null },
  { id: "4", type: "phone", original: "(555) 123-4567", replacement: "[PHONE_1]", startIndex: 221, endIndex: 235, accepted: null },
  { id: "5", type: "ssn", original: "123-45-6789", replacement: "[SSN_1]", startIndex: 243, endIndex: 254, accepted: null },
  { id: "6", type: "address", original: "1234 Oak Street, Springfield, IL 62701", replacement: "[ADDRESS_1]", startIndex: 267, endIndex: 305, accepted: null },
  { id: "7", type: "name", original: "Jane Doe", replacement: "[NAME_2]", startIndex: 340, endIndex: 348, accepted: null },
  { id: "8", type: "email", original: "jane.doe@company.org", replacement: "[EMAIL_2]", startIndex: 350, endIndex: 370, accepted: null },
  { id: "9", type: "phone", original: "(555) 987-6543", replacement: "[PHONE_2]", startIndex: 372, endIndex: 386, accepted: null },
  { id: "10", type: "name", original: "Michael Johnson", replacement: "[NAME_3]", startIndex: 392, endIndex: 407, accepted: null },
  { id: "11", type: "email", original: "michael.j@enterprise.net", replacement: "[EMAIL_3]", startIndex: 411, endIndex: 435, accepted: null },
  { id: "12", type: "email", original: "hr@corporation.com", replacement: "[EMAIL_4]", startIndex: 507, endIndex: 525, accepted: null },
  { id: "13", type: "phone", original: "(555) 000-1111", replacement: "[PHONE_3]", startIndex: 537, endIndex: 551, accepted: null },
  { id: "14", type: "name", original: "Sarah Williams", replacement: "[NAME_4]", startIndex: 570, endIndex: 584, accepted: null },
];

export function getRedactedText(text: string, entities: PIIEntity[]): string {
  let result = text;
  // Sort by startIndex descending so replacements don't mess up indices
  const sorted = [...entities]
    .filter((e) => e.accepted !== false)
    .sort((a, b) => b.startIndex - a.startIndex);
  for (const entity of sorted) {
    result = result.slice(0, entity.startIndex) + entity.replacement + result.slice(entity.endIndex);
  }
  return result;
}
