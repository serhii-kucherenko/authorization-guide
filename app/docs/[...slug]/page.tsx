import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsMobileNav } from "@/components/docs-mobile-nav";
import { DocsSidebar } from "@/components/docs-sidebar";
import { MarkdownContent } from "@/components/markdown-content";
import {
  extractTitle,
  getDocContent,
  getDocSlugs,
  rewriteDocLinks,
} from "@/lib/content";
import { findDocBySlug } from "@/lib/navigation";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  return getDocSlugs().map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const doc = findDocBySlug(slugPath);

  return {
    title: doc?.title ?? extractTitle(getDocContent(slugPath)),
    description: doc?.summary,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  let rawContent: string;
  try {
    rawContent = getDocContent(slugPath);
  } catch {
    notFound();
  }

  const content = rewriteDocLinks(rawContent);
  const doc = findDocBySlug(slugPath);

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:py-12">
      <DocsSidebar activeSlug={slugPath} />
      <div className="min-w-0 flex-1">
        <DocsMobileNav activeSlug={slugPath} activeTitle={doc?.title} />
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}
