export type DocSection = {
  title: string;
  description?: string;
  items: DocItem[];
};

export type DocItem = {
  title: string;
  slug: string;
  summary: string;
};

export const foundationDocs: DocItem[] = [
  {
    title: "Authentication vs Authorization",
    slug: "00-authentication-vs-authorization",
    summary: "The difference everyone gets wrong — and why it matters",
  },
  {
    title: "Decision guide",
    slug: "01-decision-guide",
    summary: "Step-by-step guide to pick the right approach",
  },
];

export const authenticationDocs: DocItem[] = [
  {
    title: "Sessions",
    slug: "authentication/sessions",
    summary: "Server-side sessions with cookies — simple and easy to revoke",
  },
  {
    title: "JWT & bearer tokens",
    slug: "authentication/jwt-and-bearer-tokens",
    summary: "Stateless tokens for APIs and microservices",
  },
  {
    title: "API keys",
    slug: "authentication/api-keys",
    summary: "Simple credentials for scripts and integrations",
  },
  {
    title: "OAuth & OIDC",
    slug: "authentication/oauth-and-oidc",
    summary: "Delegated login, SSO, and identity providers",
  },
];

export const authorizationDocs: DocItem[] = [
  {
    title: "RBAC",
    slug: "authorization/rbac",
    summary: "Role-Based Access Control — admin, editor, viewer",
  },
  {
    title: "ABAC",
    slug: "authorization/abac",
    summary: "Attribute-Based Access Control — rules based on context",
  },
  {
    title: "ACL",
    slug: "authorization/acl",
    summary: "Access Control Lists — per-resource permission lists",
  },
  {
    title: "Scopes",
    slug: "authorization/scopes",
    summary: "Token scopes for APIs and OAuth",
  },
  {
    title: "ReBAC",
    slug: "authorization/rebac",
    summary: "Relationship-Based Access Control — sharing and teams",
  },
  {
    title: "Policy engines",
    slug: "authorization/policy-engines",
    summary: "OPA, Cedar, Casbin — policies outside your app code",
  },
  {
    title: "Combining approaches",
    slug: "authorization/combining-approaches",
    summary: "Layer RBAC, ABAC, and ReBAC in real products",
  },
  {
    title: "Production checklist",
    slug: "authorization/production-checklist",
    summary: "What to verify before shipping access control",
  },
];

export const allDocs: DocItem[] = [
  ...foundationDocs,
  ...authenticationDocs,
  ...authorizationDocs,
];

export function findDocBySlug(slug: string): DocItem | undefined {
  return allDocs.find((doc) => doc.slug === slug);
}

export function slugToHref(slug: string): string {
  return `/docs/${slug}`;
}
