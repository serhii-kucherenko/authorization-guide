export type DecisionOption = {
  id: string;
  label: string;
  description?: string;
};

export type DecisionStep = {
  id: string;
  question: string;
  hint?: string;
  options: DecisionOption[];
};

export type DecisionRecapItem = {
  stepId: string;
  question: string;
  answerLabel: string;
};

export type DecisionResult = {
  title: string;
  summary: string;
  authentication?: string;
  authorization?: string[];
  docSlugs: string[];
  productExamples?: string[];
  recommendsRebac?: boolean;
  rebacScenarioId?: string;
  toolLinks?: { href: string; label: string; description?: string }[];
  recap: DecisionRecapItem[];
  conflicts: string[];
  compareLinks: { href: string; label: string }[];
  flowchartLinks: { href: string; label: string }[];
  authStillNeeded?: boolean;
};

export const decisionSteps: DecisionStep[] = [
  {
    id: "problem",
    question: "What are you trying to solve first?",
    hint: "Authentication proves identity. Authorization decides permissions.",
    options: [
      {
        id: "login",
        label: "How users or services log in",
        description: "Sessions, JWT, OAuth, API keys",
      },
      {
        id: "permissions",
        label: "Who can do what inside the app",
        description: "Roles, sharing, scopes, policies",
      },
      {
        id: "both",
        label: "Both — I need the full picture",
        description: "We'll walk through login and permissions",
      },
    ],
  },
  {
    id: "actor",
    question: "Who needs to authenticate?",
    options: [
      {
        id: "human",
        label: "Human users (browser or mobile app)",
      },
      {
        id: "machine",
        label: "Machine, script, or service (no human)",
      },
    ],
  },
  {
    id: "human-auth",
    question: "What kind of login experience do you need?",
    options: [
      {
        id: "social-sso",
        label: "Social login or company SSO",
        description: "Sign in with Google, Okta, Azure AD",
      },
      {
        id: "simple-web",
        label: "Simple web app on one server",
        description: "Username/password with server-side sessions (httpOnly cookies)",
      },
      {
        id: "spa-api",
        label: "SPA or mobile app with a separate API",
        description: "Frontend + backend, stateless tokens",
      },
    ],
  },
  {
    id: "machine-auth",
    question: "What kind of machine access is this?",
    options: [
      {
        id: "script",
        label: "Internal script, webhook, or early-stage API",
        description: "Developer convenience matters",
      },
      {
        id: "service",
        label: "Service-to-service in production",
        description: "Short-lived tokens, compliance",
      },
    ],
  },
  {
    id: "permission-model",
    question: "How do permissions work in your product?",
    hint: "Pick the closest match — you can combine approaches later.",
    options: [
      {
        id: "roles",
        label: "Fixed roles (admin, member, viewer)",
      },
      {
        id: "sharing",
        label: "Share individual files or documents with specific people",
      },
      {
        id: "context",
        label: "Rules depend on context (owner, department, time, IP)",
      },
      {
        id: "api-scopes",
        label: "External API clients with limited access",
      },
      {
        id: "teams",
        label: "Teams, folders, org hierarchies, inherited access",
      },
      {
        id: "policy",
        label: "Many services, changing rules, compliance audits",
      },
    ],
  },
  {
    id: "product-type",
    question: "What type of product are you building?",
    options: [
      {
        id: "admin",
        label: "Internal admin dashboard",
      },
      {
        id: "saas",
        label: "Multi-tenant SaaS",
      },
      {
        id: "api",
        label: "Developer API / platform",
      },
      {
        id: "collab",
        label: "Collaborative app (docs, design, project tools)",
      },
      {
        id: "ecommerce",
        label: "E-commerce or customer-facing app",
      },
      {
        id: "platform",
        label: "Infrastructure / Kubernetes / platform",
      },
    ],
  },
];

export const revokePriorityStep: DecisionStep = {
  id: "revoke-priority",
  question: "How quickly must access stop after logout or account disable?",
  hint: "This is the main trade-off between sessions and stateless tokens.",
  options: [
    {
      id: "immediate",
      label: "Immediately — security-sensitive or admin tools",
      description: "Prefer sessions or short-lived tokens with a denylist",
    },
    {
      id: "minutes",
      label: "Within minutes — refresh tokens can rotate",
      description: "JWT with refresh rotation is reasonable",
    },
    {
      id: "expiry",
      label: "When the token expires is fine",
      description: "Stateless JWT without instant revoke is OK",
    },
  ],
};

export const permissionAudienceStep: DecisionStep = {
  id: "permission-audience",
  question: "Who are you mostly permissioning?",
  hint: "Different audiences usually need different authorization layers.",
  options: [
    {
      id: "internal",
      label: "Our own employees or team",
      description: "RBAC in an admin or internal app",
    },
    {
      id: "customers",
      label: "Paying customers in our product",
      description: "Tenant-scoped RBAC or ABAC",
    },
    {
      id: "developers",
      label: "Third-party developers via API",
      description: "OAuth scopes on tokens",
    },
    {
      id: "mixed",
      label: "Mix of customers and API integrators",
      description: "Combine in-app RBAC with API scopes",
    },
  ],
};

const allStepsById = new Map<string, DecisionStep>(
  [...decisionSteps, revokePriorityStep, permissionAudienceStep].map((step) => [step.id, step]),
);

type ActorPlan = "actual" | "human" | "machine";

function needsAuthPath(problem: string | undefined): boolean {
  return problem === "login" || problem === "both";
}

function needsAuthzPath(problem: string | undefined): boolean {
  return problem === "permissions" || problem === "both";
}

function resolveActorPlan(answers: DecisionAnswers, plan: ActorPlan): "human" | "machine" | undefined {
  if (plan === "human") {
    return "human";
  }

  if (plan === "machine") {
    return "machine";
  }

  return answers.actor === "human" || answers.actor === "machine" ? answers.actor : undefined;
}

function buildStepSequence(answers: DecisionAnswers, actorPlan: ActorPlan): DecisionStep[] {
  const problem = answers.problem;
  const steps: DecisionStep[] = [decisionSteps[0]];

  if (!problem) {
    return steps;
  }

  const needsAuth = needsAuthPath(problem);
  const needsAuthz = needsAuthzPath(problem);
  const actor = resolveActorPlan(answers, actorPlan);

  if (needsAuth) {
    steps.push(decisionSteps[1]);

    if (actor === "machine") {
      steps.push(decisionSteps[3]);
    } else if (actor === "human") {
      steps.push(decisionSteps[2]);
      steps.push(revokePriorityStep);
    }
  }

  if (needsAuthz) {
    steps.push(decisionSteps[4]);
    steps.push(permissionAudienceStep);
  }

  if (problem === "both" || needsAuthz) {
    steps.push(decisionSteps[5]);
  }

  return steps;
}

export type WizardStepProgress = {
  current: number;
  total: number;
  totalMin?: number;
  totalMax?: number;
  progressSegments: number;
};

export function getWizardStepProgress(
  answers: DecisionAnswers,
  currentIndex: number,
): WizardStepProgress {
  const current = currentIndex + 1;
  const minTotal = buildStepSequence(answers, "machine").length;
  const maxTotal = buildStepSequence(answers, "human").length;
  const resolvedTotal = buildStepSequence(answers, "actual").length;

  if (!answers.problem) {
    const minTotal = buildStepSequence({ problem: "login" }, "machine").length;
    const maxTotal = buildStepSequence({ problem: "both" }, "human").length;

    return {
      current,
      total: maxTotal,
      totalMin: minTotal,
      totalMax: maxTotal,
      progressSegments: maxTotal,
    };
  }

  const authBranchOpen =
    needsAuthPath(answers.problem) && answers.actor !== "human" && answers.actor !== "machine";

  if (authBranchOpen && minTotal !== maxTotal) {
    return {
      current,
      total: maxTotal,
      totalMin: minTotal,
      totalMax: maxTotal,
      progressSegments: maxTotal,
    };
  }

  return {
    current,
    total: resolvedTotal,
    progressSegments: resolvedTotal,
  };
}

export function formatStepLabel(progress: WizardStepProgress, problem?: string): string {
  if (!problem) {
    return `Step ${progress.current} of up to ${progress.totalMax ?? progress.total}`;
  }

  if (progress.totalMin && progress.totalMax && progress.totalMin !== progress.totalMax) {
    return `Step ${progress.current} of ${progress.totalMin}–${progress.totalMax}`;
  }

  return `Step ${progress.current} of ${progress.total}`;
}

export type DecisionAnswers = Record<string, string>;

const DOC_READ_ORDER = [
  "00-authentication-vs-authorization",
  "authentication/sessions",
  "authentication/jwt-and-bearer-tokens",
  "authentication/oauth-and-oidc",
  "authentication/api-keys",
  "authorization/rbac",
  "authorization/acl",
  "authorization/abac",
  "authorization/scopes",
  "authorization/rebac",
  "authorization/policy-engines",
  "authorization/combining-approaches",
  "authorization/production-checklist",
];

const productStacks: Record<
  string,
  { examples: string[]; supplementAuth?: string; supplementAuthz?: string[] }
> = {
  admin: {
    examples: ["Keep roles simple", "Audit admin actions"],
    supplementAuth: "Sessions work well for internal tools",
    supplementAuthz: ["RBAC"],
  },
  saas: {
    examples: ["Scope data by tenant", "Check org membership on every query"],
    supplementAuthz: ["RBAC per organization", "ABAC for owner-only rules"],
  },
  api: {
    examples: ["Scope check on every endpoint", "Separate human vs machine tokens"],
    supplementAuth: "API keys for dev; OAuth Client Credentials in production",
    supplementAuthz: ["Scopes on tokens", "RBAC for dashboard users"],
  },
  collab: {
    examples: ["Folder inheritance", "Explicit shares override defaults"],
    supplementAuth: "OIDC for human login",
    supplementAuthz: ["ReBAC for sharing", "RBAC for workspace roles"],
  },
  ecommerce: {
    examples: ["Customers see only their orders", "Staff roles in admin panel"],
    supplementAuthz: ["RBAC for staff", "ABAC for own orders only"],
  },
  platform: {
    examples: ["Policy-as-code in git", "Centralized decision service"],
    supplementAuth: "mTLS or service accounts between services",
    supplementAuthz: ["Policy engine (OPA)"],
  },
};

function authRecommendation(answers: DecisionAnswers): {
  authentication: string;
  authDoc: string;
} {
  if (answers.actor === "machine") {
    if (answers["machine-auth"] === "service") {
      return {
        authentication: "OAuth Client Credentials (short-lived tokens)",
        authDoc: "authentication/oauth-and-oidc",
      };
    }
    return {
      authentication: "API keys with scopes",
      authDoc: "authentication/api-keys",
    };
  }

  if (answers["human-auth"] === "social-sso") {
    return {
      authentication: "OAuth 2.0 + OpenID Connect",
      authDoc: "authentication/oauth-and-oidc",
    };
  }

  const revoke = answers["revoke-priority"];

  if (answers["human-auth"] === "spa-api") {
    if (revoke === "immediate") {
      return {
        authentication: "Server-side sessions or JWT with blocklist + short TTL",
        authDoc: "authentication/sessions",
      };
    }

    return {
      authentication: "JWT access tokens + refresh token rotation",
      authDoc: "authentication/jwt-and-bearer-tokens",
    };
  }

  if (answers["human-auth"] === "simple-web" && revoke === "expiry") {
    return {
      authentication: "Server-side sessions (or JWT if you split into an API later)",
      authDoc: "authentication/sessions",
    };
  }

  return {
    authentication: "Server-side sessions with httpOnly cookies",
    authDoc: "authentication/sessions",
  };
}

function authorizationRecommendations(answers: DecisionAnswers): {
  authorization: string[];
  authzDocs: string[];
} {
  const model = answers["permission-model"];
  const audience = answers["permission-audience"];

  const map: Record<string, { authorization: string[]; authzDocs: string[] }> = {
    roles: {
      authorization: ["RBAC (Role-Based Access Control)"],
      authzDocs: ["authorization/rbac"],
    },
    sharing: {
      authorization: ["ACL (Access Control Lists)", "ReBAC if sharing grows complex"],
      authzDocs: ["authorization/acl", "authorization/rebac"],
    },
    context: {
      authorization: ["ABAC (Attribute-Based Access Control)", "Optional: policy engine at scale"],
      authzDocs: ["authorization/abac", "authorization/policy-engines"],
    },
    "api-scopes": {
      authorization: ["Scopes on tokens", "RBAC inside the dashboard"],
      authzDocs: ["authorization/scopes", "authorization/rbac"],
    },
    teams: {
      authorization: ["ReBAC (Relationship-Based Access Control)"],
      authzDocs: ["authorization/rebac"],
    },
    policy: {
      authorization: ["Policy engine (OPA, Cedar, or Casbin)"],
      authzDocs: ["authorization/policy-engines"],
    },
  };

  const base =
    map[model] ?? {
      authorization: ["RBAC to start, then layer as needed"],
      authzDocs: ["authorization/rbac", "authorization/combining-approaches"],
    };

  if (audience === "developers" && model === "roles") {
    return {
      authorization: ["Scopes on API tokens", "RBAC for your dashboard users"],
      authzDocs: ["authorization/scopes", "authorization/rbac"],
    };
  }

  if (audience === "developers" && model !== "api-scopes") {
    return {
      authorization: [...base.authorization, "Scopes for third-party API clients"],
      authzDocs: [...new Set([...base.authzDocs, "authorization/scopes"])],
    };
  }

  if (audience === "mixed") {
    return {
      authorization: [...base.authorization, "Separate scopes for API integrators"],
      authzDocs: [...new Set([...base.authzDocs, "authorization/scopes", "authorization/combining-approaches"])],
    };
  }

  if (audience === "customers" && model === "roles") {
    return {
      authorization: ["RBAC per organization/tenant", "ABAC for owner-only rules"],
      authzDocs: ["authorization/rbac", "authorization/abac"],
    };
  }

  return base;
}

export function getEstimatedTotalSteps(answers: DecisionAnswers): number {
  return getWizardStepProgress(answers, 0).progressSegments;
}

export function getVisibleSteps(answers: DecisionAnswers): DecisionStep[] {
  return buildStepSequence(answers, "actual");
}

export function getStepById(id: string): DecisionStep | undefined {
  return allStepsById.get(id);
}

export function pruneAnswers(answers: DecisionAnswers): DecisionAnswers {
  const pruned: DecisionAnswers = {};

  for (const step of getVisibleSteps(answers)) {
    const value = answers[step.id];
    if (value) {
      pruned[step.id] = value;
    }
  }

  return pruned;
}

export function isWizardComplete(answers: DecisionAnswers): boolean {
  const steps = getVisibleSteps(answers);
  return steps.length > 0 && steps.every((step) => Boolean(answers[step.id]));
}

export function getPathOutline(answers: DecisionAnswers): string[] {
  return getVisibleSteps(answers).map((step) => {
    const selected = step.options.find((option) => option.id === answers[step.id]);
    return selected?.label ?? step.question.replace(/\?$/, "");
  });
}

export function buildAnswerRecap(answers: DecisionAnswers): DecisionRecapItem[] {
  return getVisibleSteps(answers)
    .filter((step) => answers[step.id])
    .map((step) => {
      const option = step.options.find((o) => o.id === answers[step.id]);
      return {
        stepId: step.id,
        question: step.question,
        answerLabel: option?.label ?? answers[step.id],
      };
    });
}

export function pickRebacScenario(answers: DecisionAnswers): string {
  const model = answers["permission-model"];
  const product = answers["product-type"];

  if (model === "teams" || product === "collab") {
    return "team-folder-inheritance";
  }

  if (model === "sharing") {
    return "share-with-outsider";
  }

  if (product === "saas") {
    return "workspace-guest";
  }

  if (model === "roles" && product === "admin") {
    return "editor-not-owner";
  }

  return "share-with-outsider";
}

function authToCompareId(answers: DecisionAnswers): string | undefined {
  if (answers.actor === "machine") {
    return answers["machine-auth"] === "service" ? "oauth" : "api-keys";
  }

  if (answers["human-auth"] === "social-sso") {
    return "oauth";
  }

  if (answers["human-auth"] === "spa-api") {
    return "jwt";
  }

  if (answers["human-auth"] === "simple-web") {
    return "sessions";
  }

  return undefined;
}

function authzToCompareId(answers: DecisionAnswers): string | undefined {
  const map: Record<string, string> = {
    roles: "rbac",
    sharing: "acl",
    context: "abac",
    "api-scopes": "scopes",
    teams: "rebac",
    policy: "policy-engines",
  };

  return map[answers["permission-model"]];
}

function buildCompareLinks(
  answers: DecisionAnswers,
  problem: string | undefined,
): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const needsAuth = problem === "login" || problem === "both";
  const needsAuthz = problem === "permissions" || problem === "both";

  const authId = needsAuth ? authToCompareId(answers) : undefined;
  const authzId = needsAuthz ? authzToCompareId(answers) : undefined;

  if (authId) {
    const authAlternatives: Record<string, string> = {
      sessions: "jwt",
      jwt: "sessions",
      oauth: "jwt",
      "api-keys": "oauth",
    };
    const alt = authAlternatives[authId] ?? "jwt";
    links.push({
      href: `/compare?a=${authId}&b=${alt}&category=authentication`,
      label: `Compare ${authId} vs ${alt}`,
    });
  }

  if (authzId) {
    const authzAlternatives: Record<string, string> = {
      rbac: "rebac",
      rebac: "rbac",
      acl: "rebac",
      abac: "rbac",
      scopes: "rbac",
      "policy-engines": "abac",
    };
    const alt = authzAlternatives[authzId] ?? "rbac";
    links.push({
      href: `/compare?a=${authzId}&b=${alt}&category=authorization`,
      label: `Compare ${authzId} vs ${alt}`,
    });
  }

  return links;
}

function buildFlowchartLinks(problem: string | undefined): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];

  if (problem === "login" || problem === "both") {
    links.push({
      href: "/flows?chart=authentication",
      label: "Authentication flowchart",
    });
  }

  if (problem === "permissions" || problem === "both") {
    links.push({
      href: "/flows?chart=authorization",
      label: "Authorization flowchart",
    });
  }

  links.push({
    href: "/flows?chart=request-flow",
    label: "Request flow (authn → authz)",
  });

  return links;
}

export function detectConflicts(
  answers: DecisionAnswers,
  authentication?: string,
  authorization?: string[],
): string[] {
  const conflicts: string[] = [];
  const product = answers["product-type"];
  const model = answers["permission-model"];
  const audience = answers["permission-audience"];

  if (model === "api-scopes" && product === "collab") {
    conflicts.push(
      "API scopes fit external API clients, but collaborative apps usually need ReBAC or ACL so users can share documents with each other.",
    );
  }

  if (answers.actor === "machine" && product === "collab") {
    conflicts.push(
      "Collaborative products need human login (typically OIDC). Machine credentials alone won't cover sharing between people.",
    );
  }

  if (model === "roles" && product === "collab") {
    conflicts.push(
      "Fixed roles rarely cover document-level sharing — plan to add ReBAC or ACL on top of workspace roles.",
    );
  }

  if (answers["human-auth"] === "simple-web" && product === "api") {
    conflicts.push(
      "A developer API platform usually needs token-based auth for clients, not only server-rendered session cookies.",
    );
  }

  if (product === "platform" && answers.actor === "human" && answers["human-auth"] === "social-sso") {
    conflicts.push(
      "Platform infrastructure often uses mTLS or service accounts between services — SSO alone may not cover service-to-service calls.",
    );
  }

  if (
    authorization?.some((item) => item.toLowerCase().includes("rebac")) &&
    model === "api-scopes"
  ) {
    conflicts.push(
      "You picked API scopes for permissions but also need sharing semantics — scopes and ReBAC solve different problems; you may need both layers.",
    );
  }

  if (authentication?.includes("API keys") && answers["machine-auth"] === "service") {
    conflicts.push(
      "Production service-to-service traffic should prefer short-lived OAuth Client Credentials over long-lived API keys.",
    );
  }

  if (audience === "developers" && model === "roles") {
    conflicts.push(
      "You picked fixed roles but mostly permission API developers — scopes on tokens should be the primary API layer.",
    );
  }

  if (answers["revoke-priority"] === "immediate" && answers["human-auth"] === "spa-api") {
    conflicts.push(
      "SPAs often default to JWT, but instant revoke usually needs sessions, a token blocklist, or very short access-token TTL.",
    );
  }

  if (answers["revoke-priority"] === "expiry" && answers["human-auth"] === "simple-web") {
    conflicts.push(
      "A single-server web app with slow revoke tolerance still fits sessions well — JWT is optional unless you split out an API.",
    );
  }

  return conflicts;
}

function orderDocSlugs(slugs: string[]): string[] {
  const unique = [...new Set(slugs)];
  const order = new Map(DOC_READ_ORDER.map((slug, index) => [slug, index]));

  return unique.sort(
    (a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

function dedupeToolLinks(
  links: NonNullable<DecisionResult["toolLinks"]>,
): NonNullable<DecisionResult["toolLinks"]> {
  const seen = new Set<string>();

  return links.filter((link) => {
    const key = `${link.href}::${link.label}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildSummary(
  problem: string | undefined,
  authentication?: string,
  authorization?: string[],
): string {
  const parts: string[] = [];

  if (problem === "login" && authentication) {
    parts.push(`Start with ${authentication} for identity.`);
  } else if (problem === "permissions" && authorization) {
    parts.push(`Focus on ${authorization.join(" + ")} for permissions.`);
  } else if (authentication && authorization) {
    parts.push(
      `Use ${authentication} for login and ${authorization.join(" + ")} for permissions.`,
    );
  }

  parts.push("Read the linked guides below, then run through the production checklist before shipping.");

  return parts.join(" ");
}

export function computeResult(answers: DecisionAnswers): DecisionResult | null {
  const steps = getVisibleSteps(answers);

  if (!isWizardComplete(answers)) {
    return null;
  }

  const problem = answers.problem;
  const visibleIds = new Set(steps.map((step) => step.id));
  const docSlugs = ["00-authentication-vs-authorization"];

  let authentication: string | undefined;
  let authorization: string[] | undefined;
  let productExamples: string[] | undefined;

  if (problem === "login" || problem === "both") {
    const auth = authRecommendation(answers);
    authentication = auth.authentication;
    docSlugs.push(auth.authDoc);
  }

  if (problem === "permissions" || problem === "both") {
    const authz = authorizationRecommendations(answers);
    authorization = authz.authorization;
    docSlugs.push(...authz.authzDocs);
  }

  const product = answers["product-type"];
  if (visibleIds.has("product-type") && product && productStacks[product]) {
    const stack = productStacks[product];
    productExamples = stack.examples;
    docSlugs.push("authorization/combining-approaches");
  }

  docSlugs.push("authorization/production-checklist");

  const authzText = (authorization ?? []).join(" ").toLowerCase();
  const recommendsRebac =
    answers["permission-model"] === "teams" ||
    answers["permission-model"] === "sharing" ||
    answers["product-type"] === "collab" ||
    authzText.includes("rebac");

  const rebacScenarioId = recommendsRebac ? pickRebacScenario(answers) : undefined;

  const toolLinks: NonNullable<DecisionResult["toolLinks"]> = [
    { href: "/checklist", label: "Production checklist", description: "Track launch readiness" },
    { href: "/matrix", label: "RBAC matrix builder", description: "Define roles × permissions" },
    { href: "/compare", label: "Compare approaches", description: "Side-by-side trade-offs" },
  ];

  if (rebacScenarioId) {
    toolLinks.unshift({
      href: `/scenarios?scenario=${rebacScenarioId}`,
      label: "Try a sharing scenario",
      description: "Interactive ReBAC playground",
    });
  }

  const recap = buildAnswerRecap(answers);
  const conflicts = detectConflicts(answers, authentication, authorization);
  const compareLinks = buildCompareLinks(answers, problem);
  const flowchartLinks = buildFlowchartLinks(problem);

  return {
    title: "Your recommended stack",
    summary: buildSummary(problem, authentication, authorization),
    authentication,
    authorization,
    docSlugs: orderDocSlugs(docSlugs),
    productExamples,
    recommendsRebac,
    rebacScenarioId,
    toolLinks: dedupeToolLinks(toolLinks),
    recap,
    conflicts,
    compareLinks,
    flowchartLinks,
    authStillNeeded: problem === "permissions",
  };
}
