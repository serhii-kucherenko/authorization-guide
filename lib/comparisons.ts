export type CompareCodeSample = {
  language: string;
  code: string;
};

export type CompareOption = {
  id: string;
  label: string;
  category: "authentication" | "authorization";
  docSlug: string;
  bestFor: string[];
  avoidWhen: string[];
  pros: string[];
  cons: string[];
  example: string;
  codeSample: CompareCodeSample;
};

export const compareOptions: CompareOption[] = [
  {
    id: "sessions",
    label: "Sessions",
    category: "authentication",
    docSlug: "authentication/sessions",
    bestFor: ["Monoliths", "Server-rendered web", "Instant logout"],
    avoidWhen: ["Many microservices", "Mobile-first API"],
    pros: ["Easy revocation", "Small cookie payload", "Simple mental model"],
    cons: ["Stateful — needs Redis/DB", "Scaling needs shared store"],
    example: "Internal admin panel on one server",
    codeSample: {
      language: "javascript",
      code: `// Sessions store auth state on the server — the cookie is just an opaque ID.
// Shared store (Redis/DB) lets every app instance see the same sessions.

const sessions = {
  async create({ userId }) {
    const id = crypto.randomUUID();
    await redis.set(\`session:\${id}\`, JSON.stringify({ userId }), "EX", 86400);
    return id;
  },
  async get(id) {
    const raw = await redis.get(\`session:\${id}\`);
    return raw ? JSON.parse(raw) : null;
  },
  async destroy(id) {
    await redis.del(\`session:\${id}\`); // instant logout / revoke
  },
};

// 1. Login — verify credentials, create session, set httpOnly cookie
app.post("/login", async (req, res) => {
  const user = await verifyPassword(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const sessionId = await sessions.create({ userId: user.id });
  res.cookie("session_id", sessionId, { httpOnly: true, secure: true, sameSite: "lax" });
  res.json({ ok: true });
});

// 2. Every request — look up session server-side (not in the cookie payload)
app.use(async (req, res, next) => {
  const id = req.cookies.session_id;
  const session = id ? await sessions.get(id) : null;
  if (!session) return res.status(401).end();
  req.user = { id: session.userId };
  next();
});

// 3. Logout — delete session so the cookie becomes useless immediately
app.post("/logout", async (req, res) => {
  await sessions.destroy(req.cookies.session_id);
  res.clearCookie("session_id");
  res.json({ ok: true });
});

app.get("/dashboard", (req, res) => {
  res.json({ message: \`Welcome, \${req.user.id}\` });
});`,
    },
  },
  {
    id: "jwt",
    label: "JWT & bearer tokens",
    category: "authentication",
    docSlug: "authentication/jwt-and-bearer-tokens",
    bestFor: ["APIs", "Microservices", "Mobile apps"],
    avoidWhen: ["Need instant revoke without infrastructure"],
    pros: ["Stateless verification", "Horizontal scale"],
    cons: ["Hard to revoke", "Stale roles until expiry"],
    example: "REST API with SPA frontend",
    codeSample: {
      language: "javascript",
      code: `import jwt from "jsonwebtoken";

// JWTs are self-contained: the server verifies signature + expiry, no session lookup.
// Trade-off: revoking early requires a blocklist or very short lifetimes.

const JWT_SECRET = process.env.JWT_SECRET;

// 1. Login — issue a short-lived access token (claims live inside the token)
app.post("/login", async (req, res) => {
  const user = await verifyPassword(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role }, // keep payload small — no secrets here
    JWT_SECRET,
    { expiresIn: "15m", algorithm: "HS256" },
  );

  res.json({ accessToken });
});

// 2. API middleware — verify signature; reject expired or tampered tokens
app.use((req, res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET); // { sub, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// 3. Protected handler — trust claims until expiry (roles may be stale)
app.get("/orders", (req, res) => {
  res.json({ viewer: req.user.sub, role: req.user.role });
});`,
    },
  },
  {
    id: "api-keys",
    label: "API keys",
    category: "authentication",
    docSlug: "authentication/api-keys",
    bestFor: ["Scripts", "Webhooks", "Early-stage APIs"],
    avoidWhen: ["End-user browser login", "Strict short-lived-only policy"],
    pros: ["Simplest developer experience", "Instant revoke by deletion"],
    cons: ["Long-lived by default", "Often over-permissioned"],
    example: "CLI tool calling your REST API",
    codeSample: {
      language: "javascript",
      code: `// API keys identify machine clients (scripts, partners) — not end-user browsers.
// Store only a hash; show the raw key once at creation.

import crypto from "crypto";

function hashKey(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// 1. Admin creates a key — return raw value once, persist hash + metadata
async function createApiKey(clientId, scopes) {
  const raw = \`sk_live_\${crypto.randomBytes(24).toString("hex")}\`;
  await db.apiKeys.insert({
    hash: hashKey(raw),
    clientId,
    scopes, // e.g. ["orders:read"] — limit blast radius
    active: true,
  });
  return raw; // show to developer once; never log again
}

// 2. Client sends: Authorization: Bearer sk_live_...
app.use(async (req, res, next) => {
  const header = req.headers.authorization ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!raw) return res.status(401).json({ error: "Missing API key" });

  const apiKey = await db.apiKeys.findActive(hashKey(raw));
  if (!apiKey) return res.status(401).json({ error: "Invalid API key" });

  req.client = { id: apiKey.clientId, scopes: apiKey.scopes };
  next();
});

// 3. Revoke instantly — disable row (no waiting for token expiry)
await db.apiKeys.revoke(hashKey("sk_live_abc123"));

app.get("/orders", (req, res) => {
  res.json({ client: req.client.id });
});`,
    },
  },
  {
    id: "oauth",
    label: "OAuth & OIDC",
    category: "authentication",
    docSlug: "authentication/oauth-and-oidc",
    bestFor: ["Social login", "Enterprise SSO", "Delegated access"],
    avoidWhen: ["5-user internal tool with passwords"],
    pros: ["No password storage", "Industry standard"],
    cons: ["Complex setup", "Provider dependency"],
    example: "Sign in with Google + company Okta SSO",
    codeSample: {
      language: "javascript",
      code: `// OAuth/OIDC delegates login to a trusted provider — you never store their password.
// Your app receives tokens, then creates its own session or issues its own JWT.

const REDIRECT_URI = "https://app.example/auth/callback";

// 1. Start login — redirect browser to the identity provider
app.get("/auth/login", (req, res) => {
  const state = crypto.randomUUID(); // bind callback to this browser tab (CSRF protection)
  req.session.oauthState = state;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.OIDC_CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code"); // authorization code flow (server-side)
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  res.redirect(url.toString());
});

// 2. Callback — exchange one-time code for tokens (never expose client secret to browser)
app.get("/auth/callback", async (req, res) => {
  if (req.query.state !== req.session.oauthState) {
    return res.status(400).json({ error: "Invalid state" });
  }

  const tokens = await exchangeCodeForTokens({
    code: req.query.code,
    redirectUri: REDIRECT_URI,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
  });

  const profile = await verifyIdToken(tokens.id_token); // OIDC: verified user claims
  const user = await upsertUser({ sub: profile.sub, email: profile.email });

  req.session.userId = user.id; // your session/JWT from here — not the provider token
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  if (!req.session.userId) return res.redirect("/auth/login");
  res.json({ userId: req.session.userId });
});`,
    },
  },
  {
    id: "rbac",
    label: "RBAC",
    category: "authorization",
    docSlug: "authorization/rbac",
    bestFor: ["Admin panels", "Fixed org roles", "MVPs"],
    avoidWhen: ["Per-document sharing at scale"],
    pros: ["Easy to audit", "Fast checks", "Well understood"],
    cons: ["Role explosion", "Global roles don't fit sharing"],
    example: "Editor can write, viewer can read — org-wide",
    codeSample: {
      language: "javascript",
      code: `// RBAC: permissions come from a user's role — same role, same access everywhere.
// Good when org structure is stable; breaks down with per-resource sharing.

// Map each role to allowed actions (keep in config/DB, not scattered in handlers)
const rolePermissions = {
  admin: ["posts:read", "posts:write", "posts:delete"],
  editor: ["posts:read", "posts:write"],
  viewer: ["posts:read"],
};

// 1. Auth middleware already set req.user from session/JWT
//    e.g. req.user = { id: "u_1", role: "editor" }

// 2. Reusable guard — check role → permission lookup (fast, no DB per request)
function authorize(requiredPermission) {
  return (req, res, next) => {
    const allowed = rolePermissions[req.user.role] ?? [];
    if (!allowed.includes(requiredPermission)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// 3. Attach guards per route — explicit about which action each endpoint needs
router.get("/posts", authorize("posts:read"), listPosts);
router.post("/posts", authorize("posts:write"), createPost);
router.delete("/posts/:id", authorize("posts:delete"), deletePost);

// Role changes take effect on next login/token refresh — not per-document`,
    },
  },
  {
    id: "abac",
    label: "ABAC",
    category: "authorization",
    docSlug: "authorization/abac",
    bestFor: ["Owner-only rules", "Department/time constraints", "Compliance"],
    avoidWhen: ["Three roles and five permissions total"],
    pros: ["Fine-grained", "Context-aware"],
    cons: ["Harder to audit", "Rule interaction bugs"],
    example: "Delete allowed only for owner during business hours",
    codeSample: {
      language: "javascript",
      code: `// ABAC: allow/deny from attributes of user, resource, action, and environment.
// Flexible for "owner + department + time" rules — harder to audit than flat roles.

function canDeleteDocument(user, doc, env = {}) {
  const now = env.now ?? new Date();

  const isOwner = user.id === doc.ownerId;
  const sameDepartment = user.department === doc.department;
  const inBusinessHours = now.getHours() >= 9 && now.getHours() < 17;
  const notLocked = doc.status !== "archived";

  // All conditions must pass — add/remove attributes as policy evolves
  return isOwner && sameDepartment && inBusinessHours && notLocked;
}

// Handler loads context, then asks the policy function
app.delete("/documents/:id", async (req, res) => {
  const doc = await db.documents.find(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });

  const allowed = canDeleteDocument(req.user, doc, { now: new Date() });
  if (!allowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.documents.delete(doc.id);
  res.status(204).end();
});

// Same user may delete doc A but not doc B — decision is per resource + context`,
    },
  },
  {
    id: "acl",
    label: "ACL",
    category: "authorization",
    docSlug: "authorization/acl",
    bestFor: ["File sharing dialogs", "Small resource lists"],
    avoidWhen: ["Millions of resources", "Org-wide admin roles"],
    pros: ["Intuitive sharing UX", "Easy who-has-access audit"],
    cons: ["Poor scale", "No inheritance by default"],
    example: "Alice and Bob on the access list for one PDF",
    codeSample: {
      language: "javascript",
      code: `// ACL: each resource carries its own access list — great for "share this file" UX.
// Does not scale well when every row has a long list or you need org-wide roles.

// Resource stores who can do what (often in the same DB row or side table)
const document = {
  id: "doc_1",
  ownerId: "alice",
  acl: [
    { subject: "user:alice", permission: "edit" },
    { subject: "user:bob", permission: "read" },
  ],
};

function hasAclPermission(acl, userId, required) {
  const entry = acl.find((e) => e.subject === \`user:\${userId}\`);
  if (!entry) return false;
  // read is implied by edit — explicit hierarchy avoids duplicate entries
  if (required === "read") return ["read", "edit"].includes(entry.permission);
  return entry.permission === required;
}

// Grant access — typical "Share" dialog writes a new ACL entry
function grantAccess(doc, userId, permission) {
  doc.acl.push({ subject: \`user:\${userId}\`, permission });
}

// Route checks the resource's list, not the user's global role
app.get("/documents/:id", async (req, res) => {
  const doc = await db.documents.find(req.params.id);
  if (!hasAclPermission(doc.acl, req.user.id, "read")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(doc);
});

// alice → edit ✓   bob → edit ✗   carol → not on list ✗`,
    },
  },
  {
    id: "scopes",
    label: "Scopes",
    category: "authorization",
    docSlug: "authorization/scopes",
    bestFor: ["Public APIs", "OAuth clients", "Least-privilege tokens"],
    avoidWhen: ["In-app UI permission logic alone"],
    pros: ["Standard for APIs", "Clear developer docs"],
    cons: ["Scope sprawl", "Easy to miss handler checks"],
    example: "Token with read:orders but not write:orders",
    codeSample: {
      language: "javascript",
      code: `// Scopes limit what a token (or API key) can do — standard for public/partner APIs.
// Issuer grants scopes at token creation; each handler must enforce them.

// 1. Issue token with only the scopes the client asked for (and you approved)
app.post("/oauth/token", async (req, res) => {
  const { clientId, requestedScopes } = req.body; // e.g. ["orders:read"]
  const approved = intersect(requestedScopes, client.allowedScopes);

  const accessToken = await tokens.issue({
    clientId,
    scopes: approved, // ["orders:read"] — not write
    expiresIn: "1h",
  });

  res.json({ access_token: accessToken, scope: approved.join(" ") });
});

// 2. Auth middleware attaches scopes from the validated token
//    req.auth = { clientId: "app_1", scopes: ["orders:read"] }

function requireScope(scope) {
  return (req, res, next) => {
    const tokenScopes = req.auth.scopes ?? [];
    if (!tokenScopes.includes(scope)) {
      return res.status(403).json({ error: "Insufficient scope" });
    }
    next();
  };
}

// 3. Different routes need different scopes — check on every handler
router.get("/orders", requireScope("orders:read"), listOrders);
router.post("/orders", requireScope("orders:write"), createOrder); // 403 with read-only token`,
    },
  },
  {
    id: "rebac",
    label: "ReBAC",
    category: "authorization",
    docSlug: "authorization/rebac",
    bestFor: ["Google Docs-style sharing", "Teams & folders", "Collaboration"],
    avoidWhen: ["Simple CRUD with 3 roles"],
    pros: ["Natural sharing model", "Inheritance", "Scales for collaboration"],
    cons: ["Learning curve", "Needs dedicated engine often"],
    example: "Team owns folder → docs inherit team permissions",
    codeSample: {
      language: "javascript",
      code: `// ReBAC: permissions flow through relationships (member-of, parent-of, owner-of).
// Models Google Docs-style sharing: folder access inherits to nested documents.

// Tuple store: (subject, relation, object) — often backed by SpiceDB/Zanzibar
const tuples = [
  ["team:eng", "owner", "folder:projects"],
  ["user:alice", "member", "team:eng"],
  ["document:spec", "parent", "folder:projects"],
];

function check(userId, relation, resourceId) {
  const subject = \`user:\${userId}\`;
  // Walk the graph: direct grants + inherited via parent/team edges
  return expandRelationships(tuples, subject, relation, resourceId);
}

// Grant team access once — every doc in the folder inherits it
function grantTeamFolderAccess(teamId, folderId) {
  tuples.push([\`team:\${teamId}\`, "owner", \`folder:\${folderId}\`]);
}

// Handler asks: does this user have "viewer" on this document?
app.get("/documents/:id", async (req, res) => {
  const allowed = check(req.user.id, "viewer", \`document:\${req.params.id}\`);
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const doc = await db.documents.find(req.params.id);
  res.json(doc);
});

// check("alice", "viewer", "document:spec") → true (alice → member → team:eng → owns folder)`,
    },
  },
  {
    id: "policy-engines",
    label: "Policy engines",
    category: "authorization",
    docSlug: "authorization/policy-engines",
    bestFor: ["Many microservices", "Changing compliance rules", "Central policy"],
    avoidWhen: ["Tiny app with stable RBAC"],
    pros: ["Policy outside code", "Versioned rules", "Reusable across services"],
    cons: ["Infrastructure", "Language learning curve (Rego/Cedar)"],
    example: "OPA sidecar evaluating same rules in 20 services",
    codeSample: {
      language: "javascript",
      code: `// Policy engines (OPA, Cedar, etc.) keep rules outside app code — one policy, many services.
// App sends structured input; engine returns allow/deny from versioned policy bundles.

// Policy lives in Rego/Cedar — deploy independently of service releases:
//   allow { input.user.role == "admin" }
//   allow { input.user.id == input.resource.owner }

async function isAllowed({ user, action, resource }) {
  const response = await fetch("http://opa:8181/v1/data/authz/allow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { user, action, resource }, // facts only — no if/else in the app
    }),
  });

  const { result } = await response.json();
  return result === true;
}

// Thin guard — same call shape in every microservice
function authorize(action) {
  return async (req, res, next) => {
    const allowed = await isAllowed({
      user: req.user,
      action,
      resource: { type: req.resourceType, id: req.params.id },
    });
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

app.delete("/documents/:id", authorize("delete"), async (req, res) => {
  const doc = await db.documents.find(req.params.id);
  await db.documents.delete(doc.id);
  res.status(204).end();
});`,
    },
  },
];

export function getCompareOption(id: string): CompareOption | undefined {
  return compareOptions.find((o) => o.id === id);
}

export function getOptionsByCategory(category: CompareOption["category"]): CompareOption[] {
  return compareOptions.filter((o) => o.category === category);
}

export type CompareDimension = {
  label: string;
  a: string;
  b: string;
};

export function buildComparison(a: CompareOption, b: CompareOption): CompareDimension[] {
  return [
    {
      label: "Best for",
      a: a.bestFor.join(", "),
      b: b.bestFor.join(", "),
    },
    {
      label: "Avoid when",
      a: a.avoidWhen.join(", "),
      b: b.avoidWhen.join(", "),
    },
    {
      label: "Example product",
      a: a.example,
      b: b.example,
    },
    {
      label: "Top pros",
      a: a.pros.slice(0, 2).join("; "),
      b: b.pros.slice(0, 2).join("; "),
    },
    {
      label: "Top cons",
      a: a.cons.slice(0, 2).join("; "),
      b: b.cons.slice(0, 2).join("; "),
    },
  ];
}
