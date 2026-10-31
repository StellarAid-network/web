import enMessages from "@/messages/en.json";
import haMessages from "@/messages/ha.json";
import yoMessages from "@/messages/yo.json";
import igMessages from "@/messages/ig.json";
import frMessages from "@/messages/fr.json";
import esMessages from "@/messages/es.json";

export const SUPPORTED_LOCALES = ["en", "ha", "yo", "ig", "fr", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";

const LOCALE_DICTIONARIES: Record<SupportedLocale, Record<string, unknown>> = {
  en: enMessages,
  ha: haMessages,
  yo: yoMessages,
  ig: igMessages,
  fr: frMessages,
  es: esMessages,
};

function mergeWithFallback(
  fallback: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...fallback };
  for (const [key, val] of Object.entries(override)) {
    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      fallback[key] &&
      typeof fallback[key] === "object"
    ) {
      merged[key] = mergeWithFallback(
        fallback[key] as Record<string, unknown>,
        val as Record<string, unknown>,
      );
    } else if (val !== undefined) {
      merged[key] = val;
    }
  }
  return merged;
}

/**
 * Resolves localized `next-intl` messages for a target locale, gracefully
 * falling back to English (`en`) for keys not yet translated in early target locales.
 */
export function getLocaleMessages(locale: string = DEFAULT_LOCALE): typeof enMessages {
  const normalized = (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as SupportedLocale)
    : DEFAULT_LOCALE;
  if (normalized === "en") {
    return enMessages;
  }
  return mergeWithFallback(enMessages, LOCALE_DICTIONARIES[normalized]) as typeof enMessages;
}
