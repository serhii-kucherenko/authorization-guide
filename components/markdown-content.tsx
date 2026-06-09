import Link from "next/link";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/code-block";
import { MermaidDiagram } from "@/components/mermaid-diagram";

type MarkdownContentProps = {
  content: string;
};

const HIGHLIGHT_LANGS = new Set([
  "javascript",
  "js",
  "typescript",
  "ts",
  "tsx",
  "jsx",
  "json",
]);

function extractLanguage(className?: string): string | null {
  const match = /language-(\w+)/.exec(className ?? "");
  return match?.[1] ?? null;
}

function extractCodeText(children: ReactNode): string {
  if (typeof children === "string") {
    return children.replace(/\n$/, "");
  }

  if (Array.isArray(children)) {
    return children.map(extractCodeText).join("").replace(/\n$/, "");
  }

  if (isValidElement<{ children?: ReactNode }>(children)) {
    return extractCodeText(children.props.children);
  }

  return String(children ?? "").replace(/\n$/, "");
}

function extractMermaidChart(children: ReactNode): string | null {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) {
    return null;
  }

  const className = children.props.className ?? "";
  if (!className.includes("language-mermaid")) {
    return null;
  }

  return extractCodeText(children.props.children).trim();
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <article className="prose-guide">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="font-medium text-accent underline">
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          pre: ({ children, className, ...props }) => {
            const mermaidChart = extractMermaidChart(children);
            if (mermaidChart) {
              return <MermaidDiagram chart={mermaidChart} />;
            }

            if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
              const lang = extractLanguage(children.props.className);
              const code = extractCodeText(children.props.children);

              if (lang && HIGHLIGHT_LANGS.has(lang)) {
                return <CodeBlock code={code} language={lang} />;
              }
            }

            const classes = ["code-block", className].filter(Boolean).join(" ");
            return (
              <pre {...props} className={classes}>
                {children}
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
