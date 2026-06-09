import { DocsNavContent } from "@/components/docs-nav-content";

type DocsSidebarProps = {
  activeSlug?: string;
};

export function DocsSidebar({ activeSlug }: DocsSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24">
        <DocsNavContent activeSlug={activeSlug} />
      </div>
    </aside>
  );
}
