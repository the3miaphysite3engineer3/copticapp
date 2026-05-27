import { getPracticePath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRedirects";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Practice Redirect",
  description: "Redirects visitors to the localized practice route.",
});

/**
 * Redirects the locale-agnostic practice route to the preferred localized page.
 */
export default async function PracticePage() {
  return redirectToPreferredLocale(getPracticePath);
}
