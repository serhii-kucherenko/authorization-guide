# Combining Approaches

Real products rarely use one authorization model. They **layer** approaches — each handles what it does best.

This page shows common combinations and how they fit together.

---

## The layered model

```text
Request
  │
  ▼
┌─────────────────────────────────────────┐
│ 1. Authentication               │
│    Session / JWT / OAuth / API key      │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│ 2. Tenancy / org boundary               │
│    "Is this user in org-42?"            │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│ 3. RBAC (coarse)                        │
│    "Is user an editor in this org?"     │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│ 4. ABAC / ownership (fine)              │
│    "Can they edit THIS resource?"       │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│ 5. ReBAC / sharing (if applicable)      │
│    "Was it shared with them?"           │
└──────────────────┬──────────────────────┘
                   ▼
              Allow / Deny
```

Fail fast at each layer — no need to run ReBAC if RBAC already denied.

---

## Pattern 1: RBAC + ownership (most common)

**Use when:** SaaS with roles, plus "users manage their own stuff."

```text
Allow delete if:
  user has permission posts:delete (RBAC)
  OR user.id == post.authorId (ABAC-lite)
```

| Layer | Example |
|-------|---------|
| RBAC | `editor` can create posts |
| Ownership | Only author can delete their draft |

**Docs:** [RBAC](rbac.md) + [ABAC](abac.md)

---

## Pattern 2: RBAC + ReBAC (collaborative SaaS)

**Use when:** Workspace roles plus document-level sharing.

```text
Layer 1: user is member of workspace (RBAC/org)
Layer 2: user has editor relation on document (ReBAC)
```

**Example:**

```text
Can alice edit doc-99?
  1. alice is member of workspace → pass org check
  2. ReBAC: alice is editor on doc-99 OR doc-99 inherits from folder alice can edit
  → allow
```

**Docs:** [RBAC](rbac.md) + [ReBAC](rebac.md)

---

## Pattern 3: OAuth scopes + RBAC (developer platform)

**Use when:** API consumers use keys/tokens; dashboard users use roles.

| Actor | Authentication | Authorization |
|-------|-------|-------|
| Dashboard user | OIDC / session | RBAC in app |
| API integration | API key / OAuth | Scopes on token |
| Background job | Client credentials | Service role (RBAC) |

```text
API request with scope read:orders
  → Authentication: valid token
  → Authorization: token has read:orders (scope check)
  → No RBAC — token is not a "user with a role"
```

**Docs:** [Scopes](scopes.md) + [RBAC](rbac.md)

---

## Pattern 4: RBAC + ABAC + policy engine (enterprise)

**Use when:** Rules change often, many services, compliance audits.

```text
Service A, B, C all call OPA with:
  { user, action, resource, environment }

OPA evaluates Rego policies:
  - RBAC rules (role has permission)
  - ABAC rules (department, time, classification)
```

**Docs:** [Policy engines](policy-engines.md) + [ABAC](abac.md)

---

## Pattern 5: ACL → ReBAC evolution

**Use when:** You started simple and sharing grew.

| Stage | Model | Trigger to upgrade |
|-------|-------|-------------------|
| 1 | RBAC only | Users ask to share one doc |
| 2 | ACL per resource | ACL lists get huge |
| 3 | ACL + groups | Group membership sync pain |
| 4 | ReBAC | Need folder inheritance, team relations |

**Docs:** [ACL](acl.md) → [ReBAC](rebac.md)

---

## Product examples

| Product type | Typical stack |
|--------------|---------------|
| Internal admin | Session + RBAC |
| B2B SaaS | OIDC + RBAC per org + ABAC ownership |
| Developer API | API keys/OAuth + scopes |
| Notion-like | OIDC + ReBAC (workspaces, pages, shares) |
| GitHub-like | OIDC + ReBAC (org, repo, team, collaborator) |
| E-commerce | Session + RBAC (admin) + ABAC (own orders only) |

---

## Decision: add another layer?

```text
Are you writing the same exception in many places?
  ("unless shared with...", "unless owner...")
  → Add ABAC rule or ReBAC

Are API keys doing too much?
  → Add scopes

Are roles multiplying? (editor-eu, editor-readonly, ...)
  → Add ABAC or policy engine

Is sharing core to the product?
  → Plan for ReBAC early (or pay migration cost later)
```

See [Decision guide](../01-decision-guide.md).

---

## Anti-pattern: everything in JWT claims

```text
❌ JWT: { role, permissions, sharedDocs: [1,2,3], orgs: [...] }

Problems:
  - Token huge
  - Stale after permission change
  - Can't express graph relationships
```

Keep JWT minimal (`sub`, `orgId`). Load permissions server-side or call Authorization service.

---

## Related docs

- [Decision guide](../01-decision-guide.md)
- [Production checklist](production-checklist.md)
- [Authentication vs Authorization](../00-authentication-vs-authorization.md)
