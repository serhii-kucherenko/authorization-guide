"use client";

import { useEffect, useState } from "react";
import { DocsNavContent } from "@/components/docs-nav-content";

type DocsMobileNavProps = {
  activeSlug?: string;
  activeTitle?: string;
};

export function DocsMobileNav({ activeSlug, activeTitle }: DocsMobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="mb-6 lg:hidden">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-paper px-3 py-2 text-sm font-medium text-ink transition hover:border-accent/40 hover:bg-accent-soft/40"
          aria-expanded={open}
          aria-controls="docs-mobile-drawer"
        >
          <MenuIcon />
          Guides
        </button>
        <p className="min-w-0 truncate text-sm font-medium text-ink">
          {activeTitle ?? "Documentation"}
        </p>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close guide navigation"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          <aside
            id="docs-mobile-drawer"
            className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-r border-border bg-paper shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Documentation guides"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Documentation
                </p>
                <p className="text-sm font-medium text-ink">Browse guides</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border p-2 text-ink-muted transition hover:bg-paper-dark hover:text-ink"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <DocsNavContent
                activeSlug={activeSlug}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
