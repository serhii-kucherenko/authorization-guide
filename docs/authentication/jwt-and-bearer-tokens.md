# JWT & Bearer Tokens

A **JWT (JSON Web Token)** is a signed string that carries claims (user ID, role, expiry). The server can verify it **without a database lookup** — if the signature is valid and the token has not expired.

Bearer tokens are sent as: `Authorization: Bearer <token>`

---

## How it works

```text
1. User logs in
2. Server signs a JWT: { sub: "alice", role: "editor", exp: ... }
3. Client stores token (memory, httpOnly cookie — NOT localStorage if avoidable)
4. Client sends: Authorization: Bearer eyJhbG...
5. Server verifies signature + expiry → authenticated as alice
```

**Important:** JWT is for **authentication** (who). The `role` claim can *hint* at authorization, but you should still run proper [Authorization checks](../authorization/rbac.md) server-side.

---

## What's inside a JWT

```text
eyJhbGciOiJIUzI1NiIs...   ← header (algorithm)
.
eyJzdWIiOiJhbGljZSIs...   ← payload (claims — NOT encrypted, just encoded)
.
SflKxwRJSMeKKF2QT4fwpM... ← signature
```

Common claims:

| Claim | Meaning |
|-------|---------|
| `sub` | Subject — user ID |
| `exp` | Expiration time |
| `iss` | Issuer — who created the token |
| `aud` | Audience — which API should accept it |

Anyone can **read** the payload (Base64). Never put secrets in a JWT.

---

## Example flow

```text
POST /auth/login → { accessToken, refreshToken }

GET /api/posts
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

POST /auth/refresh
  { refreshToken } → new accessToken
```

**Typical lifetimes:**
- Access token: 5–15 minutes
- Refresh token: days or weeks (stored securely, rotated on use)

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Stateless verification** | Any service with the public key can validate |
| **Scales horizontally** | No shared session DB on every request |
| **Works everywhere** | Mobile, SPA, CLI, microservices |
| **Standard format** | Libraries in every language |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Hard to revoke** | Token valid until `exp` unless you add a blocklist |
| **Size** | Large claims = large headers on every request |
| **Stale permissions** | User demoted but JWT still says "admin" until expiry |
| **Easy to misuse** | localStorage + XSS = stolen tokens |

---

## When to use JWT

**Good fit:**
- REST/GraphQL APIs
- Microservices (each service validates independently)
- Mobile apps talking to a backend

**Poor fit:**
- You need one-click "log out everywhere" without extra infrastructure
- Very long-lived tokens with no rotation plan

---

## Mitigating JWT weaknesses

| Problem | Mitigation |
|---------|------------|
| Can't revoke | Short access TTL + refresh token rotation |
| Stale roles | Re-check permissions in DB or use short TTL |
| Token theft | httpOnly cookies, DPoP, or mTLS for high security |
| Algorithm confusion | Always validate `alg` header; prefer RS256/ES256 |

---

## Signing algorithms

| Type | Example | Who holds the secret/key |
|------|---------|--------------------------|
| Symmetric | HS256 | Same secret on issuer and all verifiers |
| Asymmetric | RS256, ES256 | Private key signs; public key verifies |

Prefer **asymmetric** when many services verify tokens — only the auth service holds the private key.

---

## JWT is not authorization

```text
❌ if (jwt.role === 'admin') { deleteUser() }

✅ if (await authorization.can(user, 'delete', targetUser)) { deleteUser() }
```

Use JWT to identify the user. Use RBAC, ABAC, or ReBAC to decide the action.

---

## Related docs

- [Sessions](sessions.md) — when you want easy revocation
- [OAuth & OIDC](oauth-and-oidc.md) — JWT often issued after OAuth
- [Scopes](../authorization/scopes.md) — permissions inside tokens
- [Authentication vs Authorization](../00-authentication-vs-authorization.md)
