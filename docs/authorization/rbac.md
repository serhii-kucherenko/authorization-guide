# RBAC — Role-Based Access Control

**RBAC** assigns permissions through **roles**. Users get roles; roles get permissions.

```text
Alice → role: editor → permissions: [posts:read, posts:write]
Bob  → role: viewer → permissions: [posts:read]
```

This is the **default choice** for most apps. Start here unless you know you need something more complex.

---

## How it works

```text
1. Define roles: admin, editor, viewer
2. Map each role to permissions
3. Assign each user one or more roles
4. On each request: user wants action X → does their role include X?
```

---

## Example: blog platform

**Role matrix:**

| Permission | admin | editor | viewer |
|------------|:-----:|:------:|:------:|
| posts:read | ✓ | ✓ | ✓ |
| posts:write | ✓ | ✓ | |
| posts:delete | ✓ | | |
| users:manage | ✓ | | |

**In practice:**

```text
DELETE /posts/42
  User: alice (editor)

Check: editor has posts:delete? → NO → 403 Forbidden

DELETE /posts/42
  User: bob (admin)

Check: admin has posts:delete? → YES → proceed
```

---

## Code pattern (conceptual)

```javascript
const rolePermissions = {
  admin:  ['posts:read', 'posts:write', 'posts:delete', 'users:manage'],
  editor: ['posts:read', 'posts:write'],
  viewer: ['posts:read'],
};

function authorize(requiredPermission) {
  return (req, res, next) => {
    const permissions = rolePermissions[req.user.role] ?? [];
    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
router.delete('/posts/:id', authorize('posts:delete'), deletePost);
```

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Easy to understand** | "Admin vs member" matches how people think |
| **Easy to audit** | Role matrix is one spreadsheet |
| **Fast checks** | Lookup role → check permission list |
| **Works for 80% of apps** | Dashboards, SaaS, internal tools |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Role explosion** | "Editor in EU", "Editor read-only" → too many roles |
| **No resource-level control** | "Edit **this** doc only" doesn't fit |
| **Coarse sharing** | Can't share one document with one outsider |
| **Global roles** | Role often applies everywhere, not per workspace |

---

## When to use RBAC

**Good fit:**
- Admin panels
- SaaS with org-level roles (owner, member, guest)
- CRUD apps with clear role boundaries
- MVPs — ship fast, refactor later if needed

**Poor fit:**
- Google Docs–style per-document sharing
- Permissions that depend on time, location, or resource owner
- Complex enterprise rules ("managers approve only in their department")

→ See [ABAC](abac.md), [ACL](acl.md), or [ReBAC](rebac.md).

---

## Design tips

1. **Permissions, not roles, on routes** — `authorize('posts:delete')` not `requireRole('admin')`
   - Admins inherit many permissions; routes stay stable when roles change.

2. **One role per org, not global** — `alice is editor in org-42` beats global `editor`.

3. **Keep the matrix small** — if you have 20 roles, consider ABAC or ReBAC.

4. **Store assignments in DB** — don't hardcode users in code.

---

## RBAC + ownership (common extension)

Many apps add one simple rule on top of RBAC:

```text
Allow if: user has posts:delete OR user is the resource owner
```

That's a tiny step toward [ABAC](abac.md). Still fine for most products.

---

## Related docs

- [ABAC](abac.md) — when roles aren't enough
- [Combining approaches](combining-approaches.md)
- [Authentication vs Authorization](../00-authentication-vs-authorization.md)
- [Decision guide](../01-decision-guide.md)
