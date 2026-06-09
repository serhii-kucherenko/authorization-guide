import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "docs");

export function getDocSlugs(): string[] {
  const slugs: string[] = [];

  function walk(dir: string, prefix = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), relative);
      } else if (entry.name.endsWith(".md")) {
        slugs.push(relative.replace(/\.md$/, ""));
      }
    }
  }

  walk(DOCS_DIR);
  return slugs.sort();
}

export function getDocContent(slug: string): string {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Doc not found: ${slug}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

/** Rewrite relative markdown links to site routes */
export function rewriteDocLinks(content: string): string {
  return content.replace(/\]\((?:\.\.\/)?([^)]+\.md)\)/g, (_, link: string) => {
    const slug = link.replace(/\.md$/, "");
    return `](/docs/${slug})`;
  });
}

export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1] ?? "Documentation";
}
