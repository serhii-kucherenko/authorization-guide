"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useLocalStorage } from "@/components/use-local-storage";
import {
  checklistSections,
  emptyChecklistState,
  isItemDone,
  isSectionSkipped,
  migrateLegacyChecklist,
  summarizeChecklistProgress,
  type ChecklistState,
} from "@/lib/checklist";
import { readStorage, STORAGE_KEYS } from "@/lib/storage";
import { slugToHref } from "@/lib/navigation";

function isChecklistState(value: unknown): value is ChecklistState {
  return (
    typeof value === "object" &&
    value !== null &&
    "checked" in value &&
    "skippedSections" in value
  );
}

function loadInitialState(): ChecklistState {
  const current = readStorage<unknown>(STORAGE_KEYS.checklist, null);
  if (isChecklistState(current)) {
    return current;
  }

  const v2 = readStorage<Record<string, boolean | "done" | "skipped">>(
    STORAGE_KEYS.checklistV2,
    {},
  );
  if (Object.keys(v2).length > 0) {
    return migrateLegacyChecklist(v2);
  }

  const v1 = readStorage<Record<string, boolean>>(STORAGE_KEYS.checklistV1, {});
  return migrateLegacyChecklist(v1);
}

export function ChecklistTracker() {
  const [state, setState] = useLocalStorage<ChecklistState>(
    STORAGE_KEYS.checklist,
    emptyChecklistState(),
  );

  useEffect(() => {
    setState(loadInitialState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { done, skippedSections, pending, applicable, percent } = useMemo(
    () => summarizeChecklistProgress(state),
    [state],
  );

  function setDone(id: string, checked: boolean) {
    setState((prev) => {
      const nextChecked = { ...prev.checked };
      if (checked) {
        nextChecked[id] = true;
      } else {
        delete nextChecked[id];
      }
      return { ...prev, checked: nextChecked };
    });
  }

  function toggleSectionSkip(sectionId: string) {
    setState((prev) => {
      const skipped = prev.skippedSections.includes(sectionId);
      const skippedSections = skipped
        ? prev.skippedSections.filter((id) => id !== sectionId)
        : [...prev.skippedSections, sectionId];

      if (skipped) {
        return { ...prev, skippedSections };
      }

      const section = checklistSections.find((s) => s.id === sectionId);
      const nextChecked = { ...prev.checked };
      for (const item of section?.items ?? []) {
        delete nextChecked[item.id];
      }

      return { checked: nextChecked, skippedSections };
    });
  }

  function reset() {
    setState(emptyChecklistState());
  }

  function exportProgress() {
    const lines = checklistSections.flatMap((section) => {
      const sectionSkipped = isSectionSkipped(state, section.id);
      const header = sectionSkipped
        ? `## ${section.title} (skipped)`
        : `## ${section.title}`;
      if (sectionSkipped) {
        return [header, ""];
      }
      const items = section.items.map((item) => {
        const mark = isItemDone(state, item.id) ? "x" : " ";
        return `- [${mark}] ${item.label}`;
      });
      return [header, ...items, ""];
    });
    const text = `# Production checklist progress (${done}/${applicable} done, ${skippedSections} sections skipped)\n\n${lines.join("\n")}`;
    void navigator.clipboard.writeText(text);
  }

  const allApplicableDone = applicable > 0 && done === applicable;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-medium text-ink">
            {done} done
            {skippedSections > 0 && (
              <span className="text-ink-muted">
                {" "}
                · {skippedSections} section{skippedSections === 1 ? "" : "s"}{" "}
                skipped
              </span>
            )}
            {pending > 0 && (
              <span className="text-ink-muted"> · {pending} left</span>
            )}
            {applicable > 0 && (
              <span className="text-ink-muted"> ({percent}%)</span>
            )}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportProgress}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-paper-dark"
            >
              Copy progress
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-paper-dark"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper-dark">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {allApplicableDone && (
          <p className="mt-3 text-sm font-medium text-accent">
            All applicable items checked — review once more, then ship.
          </p>
        )}
      </div>

      {checklistSections.map((section) => {
        const sectionSkipped = isSectionSkipped(state, section.id);
        const sectionDone = section.items.filter((i) =>
          isItemDone(state, i.id),
        ).length;

        return (
          <section
            key={section.id}
            className={`rounded-xl border bg-card p-5 ${
              sectionSkipped ? "border-border/60 opacity-75" : "border-border"
            }`}
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  className={`font-semibold ${sectionSkipped ? "text-ink-muted line-through" : "text-ink"}`}
                >
                  {section.title}
                </h2>
                {section.description && !sectionSkipped && (
                  <p className="text-sm text-ink-muted">{section.description}</p>
                )}
                {sectionSkipped && (
                  <p className="text-sm text-ink-muted">
                    Skipped — not using this approach.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!sectionSkipped && (
                  <span className="text-xs text-ink-muted">
                    {sectionDone}/{section.items.length}
                  </span>
                )}
                {section.optional && (
                  <button
                    type="button"
                    onClick={() => toggleSectionSkip(section.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                      sectionSkipped
                        ? "border-accent/30 bg-accent-soft text-accent"
                        : "border-border text-ink-muted hover:bg-paper-dark hover:text-ink"
                    }`}
                    aria-pressed={sectionSkipped}
                  >
                    {sectionSkipped ? "Include section" : "Skip section"}
                  </button>
                )}
              </div>
            </div>

            {!sectionSkipped && (
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-paper">
                      <input
                        type="checkbox"
                        checked={isItemDone(state, item.id)}
                        onChange={(e) => setDone(item.id, e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-border text-accent"
                      />
                      <span className="flex-1 text-sm text-ink-muted">
                        {item.critical && (
                          <span className="mr-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent">
                            Critical
                          </span>
                        )}
                        {item.label}
                        {item.docSlug && (
                          <>
                            {" "}
                            <Link
                              href={slugToHref(item.docSlug)}
                              className="text-accent underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Guide
                            </Link>
                          </>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
