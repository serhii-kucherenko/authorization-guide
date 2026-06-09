export type FlowNode = {
  id: string;
  label: string;
  type?: "start" | "decision" | "outcome";
};

export type FlowEdge = {
  from: string;
  to: string;
  label?: string;
};

export type Flowchart = {
  id: string;
  title: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export const flowcharts: Flowchart[] = [
  {
    id: "auth-problem",
    title: "Authentication or authorization?",
    description: "Separate identity from permissions before picking tools.",
    nodes: [
      { id: "start", label: "What problem are you solving?", type: "start" },
      { id: "login", label: "How users log in", type: "outcome" },
      { id: "perms", label: "Who can do what", type: "outcome" },
      { id: "both", label: "Both — start with login, then permissions", type: "outcome" },
    ],
    edges: [
      { from: "start", to: "login", label: "Login / identity" },
      { from: "start", to: "perms", label: "Permissions only" },
      { from: "start", to: "both", label: "Full stack" },
    ],
  },
  {
    id: "authentication",
    title: "Pick an authentication approach",
    description: "How users and services prove identity.",
    nodes: [
      { id: "start", label: "Who authenticates?", type: "start" },
      { id: "human", label: "Human user", type: "decision" },
      { id: "machine", label: "Machine / script / service", type: "decision" },
      { id: "sso", label: "OAuth + OpenID Connect", type: "outcome" },
      { id: "sessions", label: "Sessions + httpOnly cookies", type: "outcome" },
      { id: "jwt", label: "JWT + refresh tokens", type: "outcome" },
      { id: "api-keys", label: "API keys", type: "outcome" },
      { id: "client-creds", label: "OAuth Client Credentials", type: "outcome" },
    ],
    edges: [
      { from: "start", to: "human", label: "Human" },
      { from: "start", to: "machine", label: "Machine" },
      { from: "human", to: "sso", label: "SSO / social login" },
      { from: "human", to: "sessions", label: "Simple monolith" },
      { from: "human", to: "jwt", label: "SPA / mobile + API" },
      { from: "machine", to: "api-keys", label: "Scripts, early API" },
      { from: "machine", to: "client-creds", label: "Production M2M" },
    ],
  },
  {
    id: "authorization",
    title: "Pick an authorization model",
    description: "How your app decides allow or deny.",
    nodes: [
      { id: "start", label: "How do permissions work?", type: "start" },
      { id: "rbac", label: "RBAC — fixed roles", type: "outcome" },
      { id: "acl", label: "ACL — per-resource lists", type: "outcome" },
      { id: "abac", label: "ABAC — context rules", type: "outcome" },
      { id: "scopes", label: "Scopes — API tokens", type: "outcome" },
      { id: "rebac", label: "ReBAC — sharing & teams", type: "outcome" },
      { id: "policy", label: "Policy engine — OPA / Cedar", type: "outcome" },
    ],
    edges: [
      { from: "start", to: "rbac", label: "Admin / member / viewer" },
      { from: "start", to: "acl", label: "Share one file" },
      { from: "start", to: "abac", label: "Time, dept, owner rules" },
      { from: "start", to: "scopes", label: "Third-party API access" },
      { from: "start", to: "rebac", label: "Teams, folders, inheritance" },
      { from: "start", to: "policy", label: "Many services, compliance" },
    ],
  },
  {
    id: "request-flow",
    title: "Request flow (authentication then authorization)",
    description: "Every protected request should follow this order.",
    nodes: [
      { id: "req", label: "Incoming request", type: "start" },
      { id: "authn", label: "Validate credential", type: "decision" },
      { id: "401", label: "401 Unauthorized", type: "outcome" },
      { id: "authz", label: "Check permission", type: "decision" },
      { id: "403", label: "403 Forbidden", type: "outcome" },
      { id: "ok", label: "Run handler", type: "outcome" },
    ],
    edges: [
      { from: "req", to: "authn" },
      { from: "authn", to: "401", label: "Invalid / missing" },
      { from: "authn", to: "authz", label: "Valid user" },
      { from: "authz", to: "403", label: "Not allowed" },
      { from: "authz", to: "ok", label: "Allowed" },
    ],
  },
];

export function getFlowchart(id: string): Flowchart | undefined {
  return flowcharts.find((f) => f.id === id);
}
