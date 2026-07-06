const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|above|prior)\s+instructions/i,
  /disregard\s+(?:all\s+)?(?:previous|above|prior)\s+(?:instructions|directions)/i,
  /forget\s+(?:all\s+)?(?:previous|above|prior)/i,
  /you\s+are\s+(?:now|not\s+(?:required|bound)\s+to)/i,
  /system\s*(?::|prompt|message|instruction)/i,
  /role\s*[:=]\s*(?:system|assistant)/i,
  /<\s*system\s*>/i,
  /new\s+instructions?[:=]/i,
];

/** Strip HTML tags and normalize text for safe display in textareas. */
export function sanitizeOutput(dirty: string): string {
  if (!dirty) return "";
  return dirty
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, " ")
    .trim();
}

export function sanitizeInput(input: string): string {
  if (!input) return "";
  let clean = input;
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, "[redacted]");
  }
  return clean.trim();
}
