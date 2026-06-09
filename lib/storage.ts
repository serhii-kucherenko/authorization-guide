export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or private mode — ignore
  }
}

export function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  checklist: "auth-guide-checklist-v3",
  checklistV2: "auth-guide-checklist-v2",
  checklistV1: "auth-guide-checklist-v1",
  matrix: "auth-guide-matrix-v1",
  wizard: "auth-guide-wizard-v1",
} as const;

export type WizardStorageState = {
  answers: Record<string, string>;
  stepIndex: number;
  showResults: boolean;
};
