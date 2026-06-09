"use client";

import { useEffect, useState } from "react";
import { CodeSampleViewer } from "@/components/code-sample-viewer";
import { getShikiHighlighter } from "@/lib/shiki";

type CompareCodeSampleProps = {
  language: string;
  code: string;
  label: string;
  expanded?: boolean;
  showToolbar?: boolean;
  onHtmlReady?: (html: string | null) => void;
};

function normalizeLanguage(language: string): string {
  if (language === "js") return "javascript";
  if (language === "ts") return "typescript";
  return language;
}

export function CompareCodeSample({
  language,
  code,
  label,
  expanded,
  showToolbar = true,
  onHtmlReady,
}: CompareCodeSampleProps) {
  const [html, setHtml] = useState<string | null>(null);
  const normalized = normalizeLanguage(language);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const highlighter = await getShikiHighlighter();
        const rendered = highlighter.codeToHtml(code.trim(), {
          lang: normalized,
          theme: "github-dark",
        });
        if (!cancelled) {
          setHtml(rendered);
          onHtmlReady?.(rendered);
        }
      } catch {
        if (!cancelled) {
          const fallback = `<pre class="shiki"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
          setHtml(fallback);
          onHtmlReady?.(fallback);
        }
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, normalized, onHtmlReady]);

  return (
    <CodeSampleViewer
      label={label}
      language={normalized}
      code={code}
      html={html}
      blockClassName="compare-code"
      expanded={expanded}
      showToolbar={showToolbar}
    />
  );
}
