# ABAC — Attribute-Based Access Control

**ABAC** decides access using **attributes** — facts about the user, the resource, and the environment.

Instead of "editors can write," you write rules like:

```text
Allow write if:
  user.department == resource.department
  AND user.clearance >= resource.classification
  AND request.time is business hours
```

---

## How it works

```text
1. Collect attributes at request time
   - User: role, department, orgId, ...
   - Resource: ownerId, status, sensitivity, ...
   - Environment: time, IP, device, ...

2. Evaluate policy rules against attributes
3. Allow or deny
```

---

## Example: HR document system

**Policy:**

```text
Allow read if:
  user.id == resource.ownerId
  OR (user.department == "HR" AND resource.type == "employee_record")

Allow delete if:
  user.role == "admin"
  AND resource.status == "draft"
  AND hour(request.time) between 9 and 17
```

**Scenario:**

```text
Alice (HR, role: manager) tries to delete employee_record #99 (status: published)

Check delete policy:
  - role == admin? NO
→ 403 Forbidden

Bob (admin) tries same at 8pm:
  - hour not in 9–17? YES
→ 403 Forbidden
```

---

## ABAC vs RBAC

| | RBAC | ABAC |
|---|------|------|
| Decision based on | Role name | Attributes + rules |
| Example rule | "Editors can write" | "Owner can write drafts in their org" |
| Flexibility | Low | High |
| Complexity | Low | Medium–high |
| Best for | Fixed roles | Context-dependent rules |

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Fine-grained** | Rules match real business logic |
| **Context-aware** | Time, location, device, data sensitivity |
| **Fewer roles** | Avoid "editor-eu-weekend" role sprawl |
| **Compliance-friendly** | "Only during business hours" is expressible |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Harder to reason about** | Many rules → unexpected interactions |
| **Harder to audit** | "Why was access denied?" needs policy debugger |
| **Performance** | More data fetched per request |
| **Overkill for simple apps** | RBAC is enough for many products |

---

## When to use ABAC

**Good fit:**
- "Users can only edit **their own** resources"
- Department / region restrictions
- Time-based access (support hours only)
- Compliance (clearance levels, data classification)

**Poor fit:**
- Simple admin/user split
- You have 3 roles and 5 permissions total

---

## Implementation options

### 1. Inline code (small apps)

```javascript
function canEditPost(user, post) {
  if (user.permissions.includes('posts:write')) return true;
  if (user.id === post.authorId && post.status === 'draft') return true;
  return false;
}
```

### 2. Policy engine (larger apps)

External policies in [OPA](policy-engines.md), Cedar, or Casbin — versioned separately from app code.

### 3. Layered with RBAC

```text
Step 1: RBAC — does user have posts:write?
Step 2: ABAC — is this their post or are they in the same org?
```

See [Combining approaches](combining-approaches.md).

---

## Common attributes

| Category | Examples |
|----------|----------|
| User | id, role, department, orgId, clearance, mfaVerified |
| Resource | ownerId, orgId, status, type, createdAt |
| Environment | time, ip, country, requestPath |
| Action | read, write, delete, approve, share |

---

## Related docs

- [RBAC](rbac.md) — start here, add ABAC when needed
- [Policy engines](policy-engines.md)
- [Combining approaches](combining-approaches.md)
- [Decision guide](../01-decision-guide.md)
