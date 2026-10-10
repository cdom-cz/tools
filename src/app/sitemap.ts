import type { MetadataRoute } from "next";
import { LOCALES, SITE_URL, TOOL_IDS, pagePath, type ToolId } from "@/i18n/config";

/** One entry per language version of a page, each linking its translations via hreflang. */
function entries(tool?: ToolId): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}${pagePath(l, tool)}`]));
  return LOCALES.map((locale) => ({
    url: languages[locale],
    changeFrequency: "monthly",
    priority: tool ? 0.8 : 1,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...entries(), ...TOOL_IDS.flatMap((tool) => entries(tool))];
}
