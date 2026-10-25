/**
 * Catalogue categories with translated labels (`categories.<slug>`). Any
 * category the API returns that is not listed here is shown as-is.
 */
export const KNOWN_CATEGORIES = [
  'jams',
  'chutneys',
  'relishes',
  'pickles',
  'sweeteners',
  'spices',
] as const;

export function isKnownCategory(value: string): value is (typeof KNOWN_CATEGORIES)[number] {
  return (KNOWN_CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabel(t: (key: string) => string, value: string): string {
  return isKnownCategory(value) ? t(value) : value;
}
