export type ChecklistItem = {
  id: string;
  label: string;
  critical?: boolean;
  docSlug?: string;
};

export type ChecklistSection = {
  id: string;
  title: string;
  description?: string;
  /** Whole section can be skipped when the approach isn't used. */
  optional?: boolean;
  items: ChecklistItem[];
};

export const checklistSections: ChecklistSection[] = [
  {
    id: "foundation",
    title: "Authentication vs Authorization",
    description: "Core separation and HTTP semantics",
    items: [
      { id: "sep-checks", label: "Login / token validation is separate from permission checks", critical: true, docSlug: "00-authentication-vs-authorization" },
      { id: "401", label: "401 for missing or invalid credentials", critical: true },
      { id: "403", label: "403 for valid user who lacks permission", critical: true },
      { id: "order", label: "Every protected route runs authentication then authorization", critical: true },
    ],
  },
  {
    id: "authentication",
    title: "Authentication",
    items: [
      { id: "hash", label: "Passwords hashed with bcrypt or Argon2", docSlug: "authentication/sessions" },
      { id: "cookies", label: "Sessions use HttpOnly, Secure, SameSite cookies", docSlug: "authentication/sessions" },
      { id: "jwt-ttl", label: "JWT access tokens are short-lived (≤ 15 minutes)", docSlug: "authentication/jwt-and-bearer-tokens" },
      { id: "refresh", label: "Refresh tokens rotate on use; reuse detection enabled", docSlug: "authentication/jwt-and-bearer-tokens" },
      { id: "no-ls", label: "Tokens not stored in localStorage", critical: true },
      { id: "pkce", label: "OAuth uses Authorization Code + PKCE", docSlug: "authentication/oauth-and-oidc" },
      { id: "key-hash", label: "API keys stored as hashes; shown once at creation", docSlug: "authentication/api-keys" },
      { id: "rate-limit", label: "Rate limiting on login and token endpoints" },
    ],
  },
  {
    id: "authorization",
    title: "Authorization",
    items: [
      { id: "mutating", label: "Every mutating endpoint has an explicit permission check", critical: true, docSlug: "authorization/rbac" },
      { id: "server", label: "Permission checks run server-side only", critical: true },
      { id: "handler-scopes", label: "Scope checks at handler level, not only middleware", docSlug: "authorization/scopes" },
      { id: "deny-default", label: "Default deny — no access unless explicitly allowed", critical: true },
      { id: "admin-audit", label: "Admin / superuser paths separately audited" },
      { id: "tenant", label: "Multi-tenant queries scoped by org from token, not client input", critical: true },
    ],
  },
  {
    id: "rbac",
    title: "RBAC (if used)",
    optional: true,
    items: [
      { id: "matrix-doc", label: "Role-permission matrix documented", docSlug: "authorization/rbac" },
      { id: "perm-not-role", label: "Routes check permissions (posts:delete), not role names", docSlug: "authorization/rbac" },
      { id: "role-fresh", label: "Role changes effective without waiting for token expiry" },
    ],
  },
  {
    id: "abac",
    title: "ABAC / policies (if used)",
    optional: true,
    items: [
      { id: "policy-git", label: "Policies versioned in git", docSlug: "authorization/policy-engines" },
      { id: "deny-tests", label: "Tests for allow and deny cases" },
      { id: "deny-logs", label: "Logs explain why access was denied" },
    ],
  },
  {
    id: "rebac",
    title: "ReBAC (if used)",
    optional: true,
    items: [
      { id: "schema", label: "Schema reviewed for inheritance bugs", docSlug: "authorization/rebac" },
      { id: "shadow", label: "Shadow mode or migration plan from legacy ACL/RBAC" },
      { id: "consistency", label: "Consistency requirements understood (read-your-writes vs eventual)" },
    ],
  },
  {
    id: "api",
    title: "API keys & scopes (if used)",
    optional: true,
    items: [
      { id: "minimal-scopes", label: "Keys have minimal scopes by default", docSlug: "authorization/scopes" },
      { id: "revoke", label: "Revocation works immediately", docSlug: "authentication/api-keys" },
      { id: "key-logs", label: "Usage logged per key" },
      { id: "prefix", label: "Separate test vs live key prefixes" },
    ],
  },
  {
    id: "observability",
    title: "Observability & compliance",
    items: [
      { id: "auth-logs", label: "Auth events logged: login, logout, failed login, denied" },
      { id: "no-secrets", label: "Logs exclude secrets, tokens, passwords", critical: true },
      { id: "audit-trail", label: "Audit trail for role/permission changes" },
      { id: "gdpr", label: "Data export / delete respects authorization boundaries" },
    ],
  },
  {
    id: "testing",
    title: "Testing",
    items: [
      { id: "matrix-test", label: "Test matrix: roles × actions × resources" },
      { id: "cross-tenant", label: "Cross-tenant access is blocked", critical: true },
      { id: "expired", label: "Expired / revoked tokens rejected" },
      { id: "escalation", label: "Viewer cannot become admin via API", critical: true },
    ],
  },
];

export function allChecklistItems(): ChecklistItem[] {
  return checklistSections.flatMap((s) => s.items);
}

export function totalChecklistCount(): number {
  return allChecklistItems().length;
}

export type ChecklistState = {
  checked: Record<string, true>;
  skippedSections: string[];
};

export const emptyChecklistState = (): ChecklistState => ({
  checked: {},
  skippedSections: [],
});

export function isSectionSkipped(state: ChecklistState, sectionId: string): boolean {
  return state.skippedSections.includes(sectionId);
}

export function isItemDone(state: ChecklistState, itemId: string): boolean {
  return Boolean(state.checked[itemId]);
}

export function summarizeChecklistProgress(state: ChecklistState): {
  done: number;
  skipped: number;
  skippedSections: number;
  pending: number;
  applicable: number;
  total: number;
  percent: number;
} {
  const total = totalChecklistCount();
  let done = 0;
  let skipped = 0;
  let skippedSections = 0;

  for (const section of checklistSections) {
    if (isSectionSkipped(state, section.id)) {
      skipped += section.items.length;
      skippedSections += 1;
      continue;
    }
    for (const item of section.items) {
      if (isItemDone(state, item.id)) done += 1;
    }
  }

  const pending = total - done - skipped;
  const applicable = total - skipped;
  const percent =
    applicable === 0 ? 100 : Math.round((done / applicable) * 100);

  return {
    done,
    skipped,
    skippedSections,
    pending,
    applicable,
    total,
    percent,
  };
}

/** Migrate v1 `{ [id]: boolean }` or v2 item-status saves. */
export function migrateLegacyChecklist(
  legacy: Record<string, boolean | "done" | "skipped">,
): ChecklistState {
  const next = emptyChecklistState();
  for (const [id, value] of Object.entries(legacy)) {
    if (value === true || value === "done") next.checked[id] = true;
  }
  return next;
}
