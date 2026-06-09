# OAuth & OIDC

**OAuth 2.0** lets a user grant your app access to their data **without giving you their password**. **OpenID Connect (OIDC)** adds identity on top — "who is this user?"

| Protocol | Purpose |
|----------|---------|
| OAuth 2.0 | **Authorization** — delegated access (scopes) |
| OIDC | **Authentication** — identity (ID token with user info) |

"Sign in with Google" uses both: OIDC for identity, OAuth scopes for what you can access.

---

## Key concepts

| Term | Meaning |
|------|---------|
| **Resource owner** | The user |
| **Client** | Your app |
| **Authorization server** | Google, Auth0, Okta — handles login |
| **Access token** | Proof of granted access (often a JWT) |
| **Refresh token** | Get new access tokens without re-login |
| **ID token** (OIDC) | Proof of who the user is |
| **Scope** | What access was granted — `read:email`, `openid`, `profile` |

---

## Which flow to use

```text
Is a human user logging in?
├─ NO  → Client Credentials (machine-to-machine)
└─ YES → Does the device have a browser?
         ├─ YES → Authorization Code + PKCE
         └─ NO  → Device Authorization (CLI, TV)
```

### Authorization Code + PKCE (most common)

For web apps, SPAs (with backend), and mobile apps.

```text
1. App generates code_verifier + code_challenge
2. Redirect user to Google/Auth0 login
3. User approves → redirect back with authorization_code
4. App exchanges code + code_verifier for tokens
5. App uses access_token for API calls, ID token for identity
```

**PKCE** stops attackers from stealing the authorization code and exchanging it themselves.

### Client Credentials (machine-to-machine)

No user involved. One service calls another.

```text
POST /token
  grant_type=client_credentials
  client_id=...
  client_secret=...

→ access_token (no refresh token, no ID token)
```

Use for cron jobs, internal microservices, CI pipelines.

### Device Authorization (TV, CLI)

User logs in on a phone while the device shows a code.

---

## Example: social login

```text
User clicks "Sign in with Google"

→ Redirect to accounts.google.com
→ User logs in and consents
→ Redirect to yourapp.com/callback?code=abc123

Your server:
  POST token endpoint with code + PKCE verifier
  → { access_token, id_token, refresh_token }

id_token payload: { sub: "google-user-id", email: "alice@gmail.com" }
→ Create or find user alice in your database
→ Create session or issue your own JWT
```

**Authentication complete.** Now apply [RBAC](../authorization/rbac.md) or [ReBAC](../authorization/rebac.md) for in-app permissions.

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **No password storage** | Identity provider handles credentials |
| **SSO for enterprises** | Okta, Azure AD, Google Workspace |
| **Standard scopes** | Fine-grained delegated access |
| **Industry standard** | Libraries, docs, compliance familiarity |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Complexity** | Redirects, PKCE, token refresh, many failure modes |
| **Provider dependency** | Outage at IdP = your login breaks |
| **Misconfiguration risk** | Wrong redirect URI, missing PKCE |
| **Not your user database** | Must map external `sub` to internal user ID |

---

## OAuth is not your app's permission system

OAuth scopes control **what your app can do at Google/GitHub's API**.

Your app's internal permissions ("Alice can edit doc 123") are separate — use [RBAC](../authorization/rbac.md), [ReBAC](../authorization/rebac.md), etc.

```text
OAuth scope:     read Gmail messages (Google's API)
App permission:  edit document in your product (your Authorization layer)
```

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Implicit flow in SPA | Use Authorization Code + PKCE |
| Storing tokens in localStorage | httpOnly cookie or BFF pattern |
| Using OAuth password grant | Deprecated — use proper flows |
| Confusing access token with session | Map to your user, then issue app session/JWT |

---

## When to use

**Good fit:**
- Social login
- Enterprise SSO (SAML/OIDC federation)
- Third-party apps accessing your API on user's behalf
- Service-to-service (Client Credentials)

**Overkill when:**
- Internal tool with 5 users and password login is fine
- You only need a single API key for scripts

---

## Related docs

- [JWT & bearer tokens](jwt-and-bearer-tokens.md)
- [Scopes](../authorization/scopes.md)
- [API keys](api-keys.md)
- [Authentication vs Authorization](../00-authentication-vs-authorization.md)
