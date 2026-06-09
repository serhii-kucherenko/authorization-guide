# Sessions

Session-based authentication stores login state on the **server**. The browser only holds a small session ID (usually in an httpOnly cookie).

---

## How it works

```text
1. User logs in with password
2. Server creates a session record: { id: "sess_abc", userId: "alice", ... }
3. Server sends Set-Cookie: session_id=sess_abc; HttpOnly; Secure
4. On each request, browser sends the cookie
5. Server looks up sess_abc → finds alice → request is authenticated
```

**Authentication only.** After lookup, you still need [authorization](../authorization/rbac.md) to decide what Alice can do.

---

## Example

```text
POST /login
  { "email": "alice@example.com", "password": "..." }

→ 200 OK
  Set-Cookie: session_id=sess_abc123; HttpOnly; Secure; SameSite=Lax

GET /api/documents
  Cookie: session_id=sess_abc123

→ Server: SELECT * FROM sessions WHERE id = 'sess_abc123'
→ Found user_id = alice
→ Continue to authorization check
```

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Easy revocation** | Delete the session row → user is logged out immediately |
| **Small client payload** | Cookie is just an opaque ID (~32 bytes) |
| **Server controls everything** | Attach any data to the session without bloating a token |
| **Simple mental model** | Easy for teams new to auth |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Stateful** | Every request hits session store (Redis/DB) |
| **Scaling** | Multiple servers need a **shared** session store |
| **Cross-domain** | Cookies need careful `SameSite` / domain config |
| **Mobile / native apps** | Cookies are awkward; JWT often fits better |

---

## When to use sessions

**Good fit:**
- Monolith or small number of services
- Server-rendered web apps
- You need instant logout everywhere
- Team wants the simplest secure option

**Poor fit:**
- Dozens of microservices each validating auth independently
- Mobile-first API with no cookie support
- Multi-region with no shared session cluster

---

## Storage options

| Store | Typical scale | Notes |
|-------|---------------|-------|
| PostgreSQL | Small apps | Fine for low traffic |
| Redis | Most production web apps | Fast, TTL support |
| Memcached | High read volume | No persistence by default |

---

## Security essentials

- **httpOnly** — JavaScript cannot read the cookie (helps vs XSS)
- **Secure** — cookie only sent over HTTPS
- **SameSite=Lax or Strict** — reduces CSRF risk
- **Rotate session ID on login** — prevents session fixation
- **Short idle timeout** — e.g. 30 minutes inactive → logout

---

## Sessions vs JWT (quick comparison)

| | Sessions | JWT |
|---|----------|-----|
| Revocation | Immediate | Delayed (until expiry) |
| Server lookup | Every request | Optional (if self-contained) |
| Best for | Monoliths, web | APIs, microservices |

See [JWT & bearer tokens](jwt-and-bearer-tokens.md) for the alternative.

---

## Related docs

- [Authentication vs Authorization](../00-authentication-vs-authorization.md)
- [JWT & bearer tokens](jwt-and-bearer-tokens.md)
- [Decision guide](../01-decision-guide.md)
