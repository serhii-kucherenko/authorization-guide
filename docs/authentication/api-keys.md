# API Keys

An **API key** is a long random string that identifies a client (developer, script, integration). Send it in a header:

```text
Authorization: Bearer sk_live_abc123...
```

or

```text
X-API-Key: sk_live_abc123...
```

API keys authenticate **who is calling**. You still need [authorization](../authorization/scopes.md) to limit what they can do.

---

## How it works

```text
1. User creates an API key in your dashboard
2. You store a hash of the key (never the plaintext)
3. Client sends key on each request
4. Server looks up hash → finds owner + permissions/scopes
5. Authenticated → run authorization checks
```

---

## Example

```text
# Creating a key (dashboard)
Name: "CI pipeline"
Scopes: read:orders, write:webhooks

→ Shows once: sk_live_7f3a9b2c...

# Using the key
GET /v1/orders
  Authorization: Bearer sk_live_7f3a9b2c...

→ Lookup key → org_id=42, scopes=[read:orders]
→ Authorization: GET /orders needs read:orders → allow
```

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Simplest DX** | Copy-paste into scripts and Postman |
| **Instant revocation** | Delete the key row |
| **Easy rate limiting** | Key = identity for quotas |
| **Great for early-stage APIs** | Ship fast, add OAuth later |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Long-lived by default** | Leaked key works until revoked |
| **Often over-permissioned** | One key with full access |
| **No standard** | Every API formats keys differently |
| **Weak for user-delegated access** | Key acts as the org, not a specific user action |

---

## When to use API keys

**Good fit:**
- Developer APIs and webhooks
- Internal scripts and cron jobs
- MVP / beta before OAuth investment
- Server-to-server where the client is **your** customer's backend

**Poor fit:**
- End-user login in a browser app
- Third-party apps acting on behalf of users (use OAuth)
- High-compliance environments needing short-lived credentials only

---

## Security best practices

1. **Store hashes only** — like passwords (bcrypt/SHA-256 + salt)
2. **Show key once** at creation — "You won't see this again"
3. **Prefix by environment** — `sk_test_` vs `sk_live_` prevents accidents
4. **Attach scopes** — never one key for everything
5. **Rotate regularly** — support multiple active keys per client
6. **Audit usage** — log which key called which endpoint

---

## API keys + scopes

The best pattern: API key for **authentication**, scopes for **authorization**.

```text
Key sk_live_xxx → scopes: [read:users, read:orders]
POST /users → needs write:users → 403 Forbidden
GET  /orders → needs read:orders → 200 OK
```

See [Scopes](../authorization/scopes.md).

---

## Upgrade path

Many products evolve:

```text
Stage 1: API keys + scopes
Stage 2: Add OAuth Client Credentials for enterprise
Stage 3: Add Authorization Code + PKCE for user-connected apps
```

See [OAuth & OIDC](oauth-and-oidc.md).

---

## Related docs

- [Scopes](../authorization/scopes.md)
- [OAuth & OIDC](oauth-and-oidc.md)
- [JWT & bearer tokens](jwt-and-bearer-tokens.md)
- [Decision guide](../01-decision-guide.md)
