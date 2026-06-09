# Authentication vs Authorization

Most security bugs come from mixing these two up. They solve different problems, fail in different ways, and belong in different parts of your codebase.

---

## The one-line difference

| | Authentication | Authorization |
|---|------------------------|------------------------|
| **Question** | Who are you? | What can you do? |
| **HTTP status when it fails** | `401 Unauthorized` | `403 Forbidden` |
| **When it runs** | Login, token validation | Every protected action |
| **Example** | Password check, OAuth login | "Can Alice delete this document?" |

---

## Authentication — proving identity

Authentication verifies that a user or service is who they claim to be.

**Examples:**
- Entering a username and password
- Clicking "Sign in with Google" (OAuth/OIDC)
- Sending an API key in a request header
- Presenting a JWT access token

**Output:** An authenticated **principal** — usually a user ID, email, and maybe some claims (role, org ID).

**Docs in this guide:** [Sessions](authentication/sessions.md) · [JWT](authentication/jwt-and-bearer-tokens.md) · [API keys](authentication/api-keys.md) · [OAuth & OIDC](authentication/oauth-and-oidc.md)

---

## Authorization — granting permissions

Authorization decides what an authenticated principal is allowed to do on a specific resource.

**Examples:**
- "Admins can delete users; editors cannot"
- "Bob can edit this document because Alice shared it with him"
- "This API token can read orders but not create them"
- "Access denied — you can only edit your own posts"

**Output:** Allow or deny for a specific **action** on a specific **resource**.

**Docs in this guide:** [RBAC](authorization/rbac.md) · [ABAC](authorization/abac.md) · [ACL](authorization/acl.md) · [Scopes](authorization/scopes.md) · [ReBAC](authorization/rebac.md) · [Policy engines](authorization/policy-engines.md)

---

## Why keep them separate

### Different failure modes

| Broken authentication | Broken authorization |
|--------------|--------------|
| Anyone can pretend to be anyone | Real users do things they shouldn't |
| Catastrophic — total breach | Bad — data leaks, wrong edits, compliance issues |

### Different timing

- **Authentication** — once per session (plus token refresh)
- **Authorization** — on **every** API call, button click, and database write

### Different data

- **Authentication store** — users, passwords (hashed), MFA factors, sessions
- **Authorization store** — roles, permissions, sharing relationships, policies

### Different teams and tools

- **Authentication** — Auth0, Clerk, Cognito, Keycloak, your login service
- **Authorization** — your permission layer, OpenFGA, SpiceDB, OPA, Casbin

---

## A concrete example

Imagine a document editor like Notion.

### Authentication flow

1. Alice clicks "Log in with Google"
2. Google confirms Alice's identity
3. Your app creates a session or JWT: `user_id: alice`

**Authentication is done.** You know who Alice is.

### Authorization flow

1. Alice tries to delete page `doc-123`
2. Your app asks: "Does `alice` have `delete` permission on `doc-123`?"
3. Permission system checks:
   - Is Alice the owner? → allow
   - Was the page shared with Alice as editor (not admin)? → deny
   - Is Alice in a team that owns the workspace? → maybe allow

**Authorization decides** allow or deny. Authentication only told you the request came from Alice.

---

## Common mistakes

### Mistake 1: Checking roles in the login handler only

```text
❌ "User logged in as admin — they can do anything"
✅ "User is admin — check permission for THIS action on THIS resource"
```

Roles help authorization, but **every sensitive action still needs an explicit check**.

### Mistake 2: Treating OAuth as login-only

OAuth grants **delegated access** (scopes). "Sign in with Google" uses OAuth, but the scopes (`email`, `profile`) are authorization decisions too.

### Mistake 3: Putting permissions inside the JWT and never re-checking

A JWT might say `role: editor`, but authorization should still verify:
- Is this role still valid? (user was demoted)
- Does editor include **this** action on **this** resource?

Short-lived tokens + server-side checks fix this.

### Mistake 4: Returning 401 for permission failures

| Situation | Correct status |
|-----------|----------------|
| No token / invalid token / expired session | `401 Unauthorized` |
| Valid user, not allowed to do this | `403 Forbidden` |

Using `401` for both makes debugging harder and confuses API clients.

---

## Where each layer lives in code

```text
Request
  │
  ▼
┌─────────────────────┐
│  Authentication middleware   │  ← Validate session/JWT/API key
│  "Who is this?"     │     Fail → 401
└──────────┬──────────┘
           │ req.user = { id: "alice", ... }
           ▼
┌─────────────────────┐
│  Authorization check        │  ← RBAC / ABAC / ReBAC / scopes
│  "Can they do it?"  │     Fail → 403
└──────────┬──────────┘
           │
           ▼
      Route handler
```

Authentication middleware should **never** contain business permission logic beyond "is this token valid?"

---

## What to read next

- Not sure which approach fits your app? → [Decision guide](01-decision-guide.md)
- Building login? → [Authentication docs](authentication/sessions.md)
- Building permissions? → [RBAC](authorization/rbac.md) (start here for most apps)
