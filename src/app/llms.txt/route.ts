import { LOCALES, SITE_URL, TOOL_IDS, homePath, toolPath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-static";

/** llms.txt (https://llmstxt.org) — a concise, machine-readable site summary for LLMs. */
export function GET() {
  const cs = getDictionary("cs").common;
  const lines = [
    `# ${cs.siteName}`,
    "",
    `> ${cs.tagline}`,
    "",
    "Free, standalone helper tools that run entirely in the browser: no account, no database, nothing is sent to a server. Settings are stored only in the visitor's localStorage. Available in Czech (default) and English.",
  ];
  for (const locale of LOCALES) {
    const { catalog } = getDictionary(locale);
    lines.push("", `## ${locale === "cs" ? "Nástroje (čeština)" : "Tools (English)"}`, "");
    lines.push(`- [${getDictionary(locale).common.siteName}](${SITE_URL}${homePath(locale)}): ${getDictionary(locale).common.tagline}`);
    for (const id of TOOL_IDS) {
      lines.push(`- [${catalog[id].name}](${SITE_URL}${toolPath(locale, id)}): ${catalog[id].description}`);
    }
  }
  lines.push("", "## Optional", "", `- [Sitemap](${SITE_URL}/sitemap.xml)`, "- [CDOM](https://www.cdom.cz): author of the tools", "");
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
