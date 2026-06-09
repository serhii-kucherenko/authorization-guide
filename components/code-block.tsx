import { getShikiHighlighter } from "@/lib/shiki";

type CodeBlockProps = {
  code: string;
  language: string;
};

function normalizeLanguage(language: string): string {
  if (language === "js") return "javascript";
  if (language === "ts") return "typescript";
  return language;
}

export async function CodeBlock({ code, language }: CodeBlockProps) {
  const highlighter = await getShikiHighlighter();
  const normalized = normalizeLanguage(language);

  let html = code;
  try {
    html = highlighter.codeToHtml(code, {
      lang: normalized,
      theme: "github-dark",
    });
  } catch {
    html = `<pre class="shiki"><code>${code}</code></pre>`;
  }

  return (
    <div
      className="code-block shiki-block"
      data-language={normalized}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
