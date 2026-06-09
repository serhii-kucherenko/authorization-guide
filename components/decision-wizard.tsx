"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  computeResult,
  formatStepLabel,
  getPathOutline,
  getVisibleSteps,
  getWizardStepProgress,
  isWizardComplete,
  pruneAnswers,
  type DecisionAnswers,
} from "@/lib/decision-tool";
import { slugToHref, allDocs } from "@/lib/navigation";
import {
  readStorage,
  removeStorage,
  STORAGE_KEYS,
  writeStorage,
  type WizardStorageState,
} from "@/lib/storage";
import { buildWizardShareUrl, decodeWizardState } from "@/lib/wizard-share";

function StepProgress({
  total,
  currentIndex,
}: {
  total: number;
  currentIndex: number;
}) {
  return (
    <div className="mb-8 flex gap-2">
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`h-1.5 flex-1 rounded-full transition ${
            index < currentIndex
              ? "bg-accent"
              : index === currentIndex
                ? "bg-accent/45"
                : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

type DecisionWizardProps = {
  initialStateParam?: string;
};

export function DecisionWizard({ initialStateParam }: DecisionWizardProps) {
  const hydrated = useRef(false);
  const [answers, setAnswers] = useState<DecisionAnswers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftSelection, setDraftSelection] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const steps = useMemo(() => getVisibleSteps(answers), [answers]);
  const stepProgress = useMemo(
    () => getWizardStepProgress(answers, currentIndex),
    [answers, currentIndex],
  );
  const currentStep = steps[currentIndex];
  const result = useMemo(() => computeResult(answers), [answers]);
  const pathOutline = useMemo(() => getPathOutline(answers), [answers]);

  const persist = useCallback(
    (nextAnswers: DecisionAnswers, nextIndex: number, nextShowResults: boolean) => {
      writeStorage<WizardStorageState>(STORAGE_KEYS.wizard, {
        answers: nextAnswers,
        stepIndex: nextIndex,
        showResults: nextShowResults,
      });
    },
    [],
  );

  useEffect(() => {
    if (hydrated.current) {
      return;
    }
    hydrated.current = true;

    const fromUrl = decodeWizardState(initialStateParam);
    if (fromUrl) {
      const pruned = pruneAnswers(fromUrl.answers);
      const complete = isWizardComplete(pruned);
      setAnswers(pruned);
      setCurrentIndex(Math.min(fromUrl.stepIndex, getVisibleSteps(pruned).length - 1));
      setShowResults(complete);
      trackEvent("wizard_opened_shared");
      return;
    }

    const saved = readStorage<WizardStorageState | null>(STORAGE_KEYS.wizard, null);
    if (saved?.answers) {
      const pruned = pruneAnswers(saved.answers);
      setAnswers(pruned);
      setCurrentIndex(
        Math.min(saved.stepIndex, Math.max(0, getVisibleSteps(pruned).length - 1)),
      );
      setShowResults(saved.showResults && isWizardComplete(pruned));
    }
  }, [initialStateParam]);

  useEffect(() => {
    if (!hydrated.current || !currentStep) {
      return;
    }

    const saved = answers[currentStep.id] ?? null;
    setDraftSelection(saved);
  }, [currentStep?.id, answers]);

  useEffect(() => {
    if (!hydrated.current) {
      return;
    }

    if (currentIndex >= steps.length) {
      setCurrentIndex(Math.max(0, steps.length - 1));
    }
  }, [currentIndex, steps.length]);

  useEffect(() => {
    if (!hydrated.current) {
      return;
    }

    persist(answers, currentIndex, showResults);
  }, [answers, currentIndex, showResults, persist]);

  const continueFromStep = useCallback(() => {
    if (!currentStep || !draftSelection) {
      return;
    }

    const nextAnswers = pruneAnswers({ ...answers, [currentStep.id]: draftSelection });
    setAnswers(nextAnswers);

    const nextSteps = getVisibleSteps(nextAnswers);
    const stepIndex = nextSteps.findIndex((step) => step.id === currentStep.id);
    const isLast = stepIndex >= nextSteps.length - 1;

    trackEvent("wizard_step_continue", {
      step: currentStep.id,
      option: draftSelection,
    });

    if (isLast && isWizardComplete(nextAnswers)) {
      setShowResults(true);
      trackEvent("wizard_completed", { path: nextAnswers.problem ?? "unknown" });
      return;
    }

    if (stepIndex < nextSteps.length - 1) {
      setCurrentIndex(stepIndex + 1);
    }
  }, [answers, currentStep, draftSelection]);

  function selectOption(optionId: string) {
    setDraftSelection(optionId);
  }

  function resetWizard() {
    setConfirmReset(false);
    setAnswers({});
    setCurrentIndex(0);
    setDraftSelection(null);
    setShowResults(false);
    removeStorage(STORAGE_KEYS.wizard);
    trackEvent("wizard_reset");
  }

  function goBack() {
    if (showResults) {
      setShowResults(false);
      setCurrentIndex(Math.max(0, steps.length - 1));
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  async function copyShareLink() {
    const url = buildWizardShareUrl(answers, showResults ? steps.length - 1 : currentIndex);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      trackEvent("wizard_shared");
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (showResults || confirmReset || !currentStep) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return;
      }

      if (event.key === "Enter" && draftSelection) {
        event.preventDefault();
        continueFromStep();
        return;
      }

      const digit = Number.parseInt(event.key, 10);
      if (digit >= 1 && digit <= currentStep.options.length) {
        event.preventDefault();
        selectOption(currentStep.options[digit - 1].id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showResults, confirmReset, currentStep, draftSelection, continueFromStep]);

  const stepLabel = formatStepLabel(stepProgress, answers.problem);

  if (showResults && result) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Recommendation ready
        </div>

        <h2 className="mb-3 text-2xl font-semibold text-ink">{result.title}</h2>
        <p className="mb-8 text-ink-muted">{result.summary}</p>

        {result.authStillNeeded && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Permissions assume you already know who the user is. You still need authentication
            (sessions, JWT, or OIDC) before these authorization rules can run.
          </div>
        )}

        {result.recap.length > 0 && (
          <div className="mb-8 rounded-xl border border-border bg-paper p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Based on your answers
            </h3>
            <ul className="space-y-2 text-sm">
              {result.recap.map((item) => (
                <li key={item.stepId} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <span className="text-ink-muted">{item.question}</span>
                  <span className="font-medium text-ink sm:ml-auto sm:text-right">
                    {item.answerLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.conflicts.length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Worth double-checking
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-amber-950">
              {result.conflicts.map((conflict) => (
                <li key={conflict}>{conflict}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {result.authentication && (
            <div className="rounded-xl border border-border bg-paper p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Authentication
              </h3>
              <p className="font-medium text-ink">{result.authentication}</p>
            </div>
          )}
          {result.authorization && (
            <div className="rounded-xl border border-border bg-paper p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Authorization
              </h3>
              <ul className="space-y-1">
                {result.authorization.map((item) => (
                  <li key={item} className="font-medium text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {result.productExamples && (
          <div className="mb-8 rounded-xl border border-border bg-paper p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Tips for your product type
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {result.productExamples.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {result.compareLinks.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-ink">Compare options</h3>
            <div className="flex flex-wrap gap-2">
              {result.compareLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-border bg-paper px-3 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {result.flowchartLinks.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-ink">Related flowcharts</h3>
            <div className="flex flex-wrap gap-2">
              {result.flowchartLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-border bg-paper px-3 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {result.toolLinks && result.toolLinks.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-ink">Try these tools</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.toolLinks.map((tool) => (
                <Link
                  key={tool.href + tool.label}
                  href={tool.href}
                  className={`rounded-xl border p-4 transition hover:shadow-sm ${
                    tool.href.startsWith("/scenarios")
                      ? "border-accent bg-accent-soft hover:border-accent"
                      : "border-border bg-paper hover:border-accent/40"
                  }`}
                >
                  <span className="block font-medium text-ink">{tool.label}</span>
                  {tool.description && (
                    <span className="text-sm text-ink-muted">{tool.description}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-ink">Read next</h3>
          <div className="flex flex-wrap gap-2">
            {result.docSlugs.map((slug) => {
              const doc = allDocs.find((d) => d.slug === slug);
              return (
                <Link
                  key={slug}
                  href={slugToHref(slug)}
                  className="rounded-lg border border-border bg-paper px-3 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
                >
                  {doc?.title ?? slug}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper-dark"
          >
            {shareCopied ? "Link copied!" : "Share results"}
          </button>
          <Link
            href="/docs/01-decision-guide"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-paper-dark"
          >
            Read full decision guide
          </Link>
        </div>

        {confirmReset && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
            role="presentation"
            onClick={() => setConfirmReset(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg"
              role="dialog"
              aria-labelledby="reset-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id="reset-title" className="mb-2 text-lg font-semibold text-ink">
                Start over?
              </h3>
              <p className="mb-6 text-sm text-ink-muted">
                Your answers will be cleared. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetWizard}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Yes, reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentStep) {
    return null;
  }

  const canContinue = Boolean(draftSelection);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-6 sm:p-8">
        <StepProgress total={stepProgress.progressSegments} currentIndex={currentIndex} />

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
          {stepLabel}
        </p>
        <h2 className="mb-2 text-xl font-semibold text-ink sm:text-2xl">
          {currentStep.question}
        </h2>
        {currentStep.hint && (
          <p className="mb-4 text-sm text-ink-muted">{currentStep.hint}</p>
        )}

        {answers.problem === "both" && pathOutline.length > 1 && (
          <div className="mb-6 rounded-lg border border-border bg-paper px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Your path
            </p>
            <ol className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-ink-muted">
              {pathOutline.map((label, index) => (
                <li key={`${label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden>→</span>}
                  <span className={index === currentIndex ? "font-medium text-ink" : undefined}>
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="mb-3 text-xs text-ink-muted">
          Press <kbd className="rounded border border-border bg-paper px-1">1</kbd>–
          <kbd className="rounded border border-border bg-paper px-1">
            {Math.min(currentStep.options.length, 9)}
          </kbd>{" "}
          to select, <kbd className="rounded border border-border bg-paper px-1">Enter</kbd> to
          continue
        </p>

        <div className="space-y-3">
          {currentStep.options.map((option, index) => {
            const selected = draftSelection === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(option.id)}
                className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-paper hover:border-accent/40 hover:bg-paper-dark"
                }`}
              >
                <span className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-card text-xs font-semibold text-ink-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{option.label}</span>
                    {option.description && (
                      <span className="mt-1 block text-sm text-ink-muted">
                        {option.description}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-card/95 px-6 py-4 backdrop-blur sm:px-8">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIndex === 0}
          className="text-sm font-medium text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={continueFromStep}
          disabled={!canContinue}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
