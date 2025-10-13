type ClassValue = string | string[] | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  const result: string[] = [];
  const seen = new Set<string>();

  const append = (value: ClassValue): void => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(append);
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    for (const part of trimmed.split(/\s+/)) {
      if (!seen.has(part)) {
        seen.add(part);
        result.push(part);
      }
    }
  };

  values.forEach(append);

  return result.join(" ");
}
