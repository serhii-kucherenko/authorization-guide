import type { DecisionAnswers } from "@/lib/decision-tool";

const WIZARD_STATE_VERSION = 1;

type WizardStatePayload = {
  v: number;
  a: DecisionAnswers;
  i: number;
};

export function encodeWizardState(answers: DecisionAnswers, stepIndex: number): string {
  const payload: WizardStatePayload = {
    v: WIZARD_STATE_VERSION,
    a: answers,
    i: stepIndex,
  };

  return btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeWizardState(raw: string | undefined | null): {
  answers: DecisionAnswers;
  stepIndex: number;
} | null {
  if (!raw) {
    return null;
  }

  try {
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as WizardStatePayload;

    if (payload.v !== WIZARD_STATE_VERSION || !payload.a || typeof payload.i !== "number") {
      return null;
    }

    return { answers: payload.a, stepIndex: payload.i };
  } catch {
    return null;
  }
}

export function buildWizardShareUrl(answers: DecisionAnswers, stepIndex: number): string {
  if (typeof window === "undefined") {
    return "/tool";
  }

  const state = encodeWizardState(answers, stepIndex);
  const url = new URL("/tool", window.location.origin);
  url.searchParams.set("state", state);
  return url.toString();
}
