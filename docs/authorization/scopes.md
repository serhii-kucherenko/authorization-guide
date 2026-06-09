# Scopes

**Scopes** are named permissions attached to a token or API key. They answer: "This credential can only do these things."

```text
access_token scopes: [read:users, read:orders]
```

Scopes are **authorization** — they limit what an already-authenticated client can do.

---

## How it works

```text
1. Client authenticates (OAuth, API key creation)
2. Client receives token with scopes: read:orders, write:webhooks
3. On each API call, server checks: does this endpoint require a scope the token has?
```

---

## Example: developer API

**Token scopes:** `read:users`, `read:orders`

```text
GET /v1/users/1     → requires read:users  → ✓ allow
GET /v1/orders      → requires read:orders → ✓ allow
POST /v1/orders     → requires write:orders → ✗ 403 Forbidden
DELETE /v1/users/1  → requires write:users  → ✗ 403 Forbidden
```

**Scope assignment at key creation:**

```text
Dashboard: Create API key
  ☑ read:users
  ☑ read:orders
  ☐ write:orders
  ☐ write:users

→ Key can only read, never write
```

---

## Scopes vs RBAC

| | Scopes | RBAC |
|---|--------|------|
| Attached to | Token / API key | User account |
| Typical use | External API access | In-app user permissions |
| Changes when | New token issued | Admin changes user role |
| Example | `read:invoices` on OAuth token | `billing_admin` role in dashboard |

Many products use **both**:

- User logs in → RBAC for UI actions
- User creates API key → scopes for programmatic access

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Least privilege for APIs** | Keys can't do more than selected |
| **OAuth standard** | Scopes in authorization consent screen |
| **Clear for developers** | Document scopes in API reference |
| **Easy to rate-limit** | Per-scope or per-key quotas |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Not for UI logic alone** | In-app "can edit doc 5" needs RBAC/ReBAC |
| **Scope sprawl** | 50 scopes become hard to manage |
| **Coarse if poorly designed** | `admin` scope = one key does everything |
| **Check discipline** | Easy to forget scope check on one route |

---

## When to use scopes

**Good fit:**
- Public or partner APIs
- OAuth third-party integrations
- API keys with limited access
- Webhooks and automation tokens

**Poor fit:**
- Internal "can user X edit document Y" — use [ReBAC](rebac.md) or [RBAC](rbac.md)

---

## Design guidelines

### 1. Resource + action naming

```text
Good: read:orders, write:orders, read:users
Avoid: orders, full_access, admin (too vague)
```

### 2. Check at the handler, not only middleware

```text
Middleware: "Is this token valid?"     → Authentication
Handler:    "Does token have scope?"   → Authorization
```

Middleware that validates the token is not enough. Each endpoint must verify the required scope.

### 3. Default to minimal scopes

New API keys should start with read-only scopes.

### 4. Document every scope

| Scope | Description |
|-------|-------------|
| `read:orders` | List and view orders |
| `write:orders` | Create and update orders |
| `write:webhooks` | Register webhook endpoints |

---

## OAuth scope flow

```text
User authorizes app → consent screen:

  "MyApp wants to:
   • Read your email
   • View your calendar"

Scopes: openid email calendar.read

→ Access token includes granted scopes only
→ App cannot access calendar.write without new consent
```

See [OAuth & OIDC](../authentication/oauth-and-oidc.md).

---

## Related docs

- [API keys](../authentication/api-keys.md)
- [OAuth & OIDC](../authentication/oauth-and-oidc.md)
- [RBAC](rbac.md)
- [Production checklist](production-checklist.md)
