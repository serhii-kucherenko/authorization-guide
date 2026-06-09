# Production Checklist

Run through this before shipping authentication or authorization to production.

---

## Authentication vs Authorization

- [ ] Login / token validation is separate from permission checks
- [ ] `401` for missing/invalid credentials
- [ ] `403` for valid user who lacks permission
- [ ] Every protected route runs authentication **then** authorization

---

## Authentication

- [ ] Passwords hashed with bcrypt or Argon2 (never plaintext, never MD5)
- [ ] Sessions use `HttpOnly`, `Secure`, `SameSite` cookies
- [ ] JWT access tokens are short-lived (≤ 15 minutes typical)
- [ ] Refresh tokens rotate on use; reuse detection enabled
- [ ] Tokens not stored in `localStorage` (prefer httpOnly cookie or memory)
- [ ] OAuth uses Authorization Code + PKCE (not implicit flow)
- [ ] API keys stored as hashes; shown only once at creation
- [ ] Rate limiting on login and token endpoints

---

## Authorization

- [ ] Every mutating endpoint has an explicit permission check
- [ ] Permission checks run **server-side** (never trust the client)
- [ ] Scope checks at **handler level**, not only auth middleware
- [ ] Default deny — no access unless explicitly allowed
- [ ] Admin/superuser paths separately audited
- [ ] Multi-tenant: queries scoped by org/tenant ID from authentication, not from client input alone

---

## RBAC (if used)

- [ ] Role-permission matrix documented
- [ ] Routes check permissions (`posts:delete`), not role names (`admin`)
- [ ] Role changes take effect without waiting for token expiry (or TTL is short)

---

## ABAC / policies (if used)

- [ ] Policies versioned in git
- [ ] Tests for allow **and** deny cases
- [ ] Logs explain why access was denied (for support/debugging)

---

## ReBAC (if used)

- [ ] Schema reviewed for inheritance bugs
- [ ] Shadow mode or migration plan from legacy ACL/RBAC
- [ ] Consistency requirements understood (read-your-writes vs eventual)

---

## API keys & scopes (if used)

- [ ] Keys have minimal scopes by default
- [ ] Revocation works immediately
- [ ] Usage logged per key
- [ ] Separate test vs live key prefixes

---

## Observability & compliance

- [ ] Auth events logged: login, logout, failed login, permission denied
- [ ] Logs exclude secrets, tokens, passwords
- [ ] Audit trail for role/permission changes
- [ ] Data export / delete respects authorization boundaries

---

## Testing

- [ ] Test matrix: roles × actions × resources
- [ ] Test cross-tenant access is blocked
- [ ] Test expired/revoked tokens rejected
- [ ] Test escalation paths (viewer cannot become admin via API)

**Example matrix:**

| User | Action | Resource | Expected |
|------|--------|----------|----------|
| viewer | read | own post | 200 |
| viewer | delete | own post | 403 |
| editor | delete | other's post | 403 |
| admin | delete | any post | 200 |
| anon | read | public post | 200 |
| anon | read | private post | 401 |

---

## Common production bugs

| Bug | Fix |
|-----|-----|
| IDOR — change `userId` in URL | Authorize resource ownership server-side |
| Missing check on PATCH | Same authorization on GET, POST, PUT, PATCH, DELETE |
| Trust `X-User-Id` header | Derive user from validated token only |
| Permissions in frontend only | Duplicate every check on server |
| Long-lived JWT with admin role | Short TTL + server-side role lookup |

---

## Related docs

- [Authentication vs Authorization](../00-authentication-vs-authorization.md)
- [Combining approaches](combining-approaches.md)
- [Decision guide](../01-decision-guide.md)
