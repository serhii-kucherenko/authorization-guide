export type AuthMindmapNode = {
  id: string;
  label: string;
  blurb?: string;
  details?: string[];
  docSlug?: string;
  children?: AuthMindmapNode[];
};

export const authMindmapRoot: AuthMindmapNode = {
  id: "auth",
  label: "AUTH",
  blurb: "Two jobs on every protected request: prove identity, then decide access.",
  details: [
    "Request → authenticate (401 if not) → authorize (403 if not) → handler",
  ],
  children: [
    {
      id: "authentication",
      label: "Authentication",
      blurb: "Who are you?",
      details: ["Answers: which user or service is calling"],
      children: [
        {
          id: "human",
          label: "Human users",
          blurb: "Browser, mobile app — someone clicking login",
          children: [
            {
              id: "sessions",
              label: "Sessions",
              blurb: "Server stores session; browser holds an httpOnly cookie",
              details: ["Instant logout — delete the session row", "Best for monoliths & SSR"],
              docSlug: "authentication/sessions",
            },
            {
              id: "jwt",
              label: "JWT & bearer tokens",
              blurb: "Signed token on every request — no server lookup",
              details: ["Scales across services", "Revoke is harder — short TTL or blocklist"],
              docSlug: "authentication/jwt-and-bearer-tokens",
            },
            {
              id: "oauth",
              label: "OAuth & OIDC",
              blurb: "Sign in with Google, Okta, etc.",
              details: ["You don't store passwords", "Standard for SSO & social login"],
              docSlug: "authentication/oauth-and-oidc",
            },
          ],
        },
        {
          id: "machine",
          label: "Machines & services",
          blurb: "Scripts, webhooks, service-to-service",
          children: [
            {
              id: "api-keys",
              label: "API keys",
              blurb: "Long-lived secret in a header",
              details: ["Simple for CLIs & webhooks", "Revoke by deleting the key"],
              docSlug: "authentication/api-keys",
            },
            {
              id: "client-credentials",
              label: "Client credentials",
              blurb: "Short-lived OAuth tokens between services",
              details: ["No human involved", "Preferred in production S2S"],
              docSlug: "authentication/oauth-and-oidc",
            },
          ],
        },
      ],
    },
    {
      id: "authorization",
      label: "Authorization",
      blurb: "What can you do?",
      details: ["Runs after authentication — uses identity + resource + action"],
      children: [
        {
          id: "rbac",
          label: "RBAC",
          blurb: "Roles → permissions (admin, editor, viewer)",
          details: ["Default choice for most apps", "Weak at per-document sharing"],
          docSlug: "authorization/rbac",
        },
        {
          id: "acl",
          label: "ACL",
          blurb: "Access list per resource",
          details: ["“Share with Alice & Bob” on one file", "Doesn't scale to millions of resources"],
          docSlug: "authorization/acl",
        },
        {
          id: "abac",
          label: "ABAC",
          blurb: "Rules on attributes — owner, dept, time, IP",
          details: ["Flexible context rules", "Harder to audit than roles"],
          docSlug: "authorization/abac",
        },
        {
          id: "scopes",
          label: "Scopes",
          blurb: "Permissions on the token — read:orders",
          details: ["Standard for public APIs", "Must still check in every handler"],
          docSlug: "authorization/scopes",
        },
        {
          id: "rebac",
          label: "ReBAC",
          blurb: "Relationships — teams, folders, sharing",
          details: ["Google Docs-style inheritance", "Often needs a graph engine"],
          docSlug: "authorization/rebac",
        },
        {
          id: "policy-engines",
          label: "Policy engines",
          blurb: "Rules outside app code — OPA, Cedar, Casbin",
          details: ["Same policy across many services", "Extra infra to run"],
          docSlug: "authorization/policy-engines",
        },
      ],
    },
  ],
};

function renderNode(node: AuthMindmapNode, headingLevel: number): string[] {
  const lines: string[] = [`${"#".repeat(headingLevel)} ${node.label}`];

  if (node.blurb) {
    lines.push(`- ${node.blurb}`);
  }

  for (const detail of node.details ?? []) {
    lines.push(`- ${detail}`);
  }

  if (node.docSlug) {
    lines.push(`- [Read guide →](/docs/${node.docSlug})`);
  }

  for (const child of node.children ?? []) {
    lines.push("");
    lines.push(...renderNode(child, headingLevel + 1));
  }

  return lines;
}

export function buildAuthMindmapMarkdown(): string {
  const frontmatter = `---
markmap:
  color:
    - "#ea580c"
    - "#0f766e"
    - "#14b8a6"
    - "#57534e"
  colorFreezeLevel: 2
  initialExpandLevel: 2
  maxWidth: 280
  fitRatio: 0.9
  maxInitialScale: 1.5
---`;

  const body = renderNode(authMindmapRoot, 1);

  return [frontmatter, "", ...body].join("\n");
}
