export interface TextPart {
  text: string;
  match: boolean;
}

export function splitHighlight(text: string, phrases: string[]): TextPart[] {
  const needles = [...new Set(phrases.map((phrase) => phrase.trim()).filter((phrase) => phrase.length >= 2))].sort(
    (left, right) => right.length - left.length,
  );
  const lower = text.toLowerCase();
  const marks: Array<{ start: number; end: number }> = [];

  for (const phrase of needles) {
    const needle = phrase.toLowerCase();
    let from = 0;
    while (from < text.length) {
      const index = lower.indexOf(needle, from);
      if (index < 0) break;
      const end = index + phrase.length;
      const overlaps = marks.some((mark) => index < mark.end && end > mark.start);
      if (!overlaps) marks.push({ start: index, end });
      from = index + Math.max(needle.length, 1);
    }
  }

  marks.sort((left, right) => left.start - right.start);
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start > cursor) parts.push({ text: text.slice(cursor, mark.start), match: false });
    parts.push({ text: text.slice(mark.start, mark.end), match: true });
    cursor = mark.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  if (parts.length === 0) parts.push({ text, match: false });
  return parts;
}
