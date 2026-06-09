# Policy Engines

A **policy engine** stores authorization rules **outside your application code**. Your app asks: "Can Alice delete document 123?" — the engine evaluates policies and returns allow/deny.

This is **policy-as-code**: versioned, reviewable, auditable rules.

---

## Why use a policy engine?

| Without engine | With engine |
|----------------|-------------|
| `if (user.role === 'admin' \|\| user.id === doc.owner)` scattered in 50 files | One policy file, one evaluation call |
| Change rule → deploy app | Change policy → reload (no deploy) |
| Hard to audit "what are all the rules?" | Policies in git |
| Same logic duplicated in 5 microservices | Central decision service |

---

## Main options

| Engine | Language | Style | Best for |
|--------|----------|-------|----------|
| **OPA** | Rego | General-purpose | K8s, infra, multi-domain |
| **Cedar** | Cedar DSL | Authorization-specific | Fine-grained application authorization, AWS-style |
| **Casbin** | Config + code | Embedded library | In-process checks, many languages |
| **Cerbos** | YAML | Human-readable policies | App-level without Rego learning curve |

---

## OPA (Open Policy Agent)

**Rego** policies evaluated by OPA server (sidecar or central service).

**Example policy (conceptual):**

```rego
allow {
  input.user.role == "admin"
}

allow {
  input.action == "read"
  input.resource.public == true
}

allow {
  input.action == "edit"
  input.resource.owner == input.user.id
}
```

**Request:**

```json
{
  "input": {
    "user": { "id": "alice", "role": "editor" },
    "action": "edit",
    "resource": { "id": "doc-1", "owner": "alice", "public": false }
  }
}
```

**Pros:** Extremely flexible, CNCF graduated, huge ecosystem  
**Cons:** Rego learning curve, easy to write confusing policies

---

## Cedar

Policy language from AWS, designed specifically for authorization.

**Example (conceptual):**

```cedar
permit(
  principal,
  action == Action::"edit",
  resource
) when {
  resource.owner == principal
};
```

**Pros:** Readable, analyzable, schema validation  
**Cons:** Needs Cedar agent/engine (often via OPAL for distribution)

---

## Casbin

Embedded **library** (Go, Node, Python, Java, …) — not always a separate service.

**Model file** defines how requests match policies:

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

**Policy file:**

```csv
p, admin, data1, read
p, admin, data1, write
g, alice, admin
```

**Code:**

```javascript
const allowed = await enforcer.enforce('alice', 'data1', 'read');
```

**Pros:** Embedded, multi-language, supports RBAC/ABAC/ReBAC models  
**Cons:** Policies live with app unless you build sync infrastructure

---

## Comparison

| | OPA | Cedar | Casbin |
|---|-----|-------|--------|
| Deployment | Sidecar / service | Agent + OPAL | In-process library |
| Policy language | Rego | Cedar | CSV/CONF + model |
| Kubernetes | Excellent | Growing | Possible |
| Application authorization | Good | Excellent | Good |
| Learning curve | Steep | Moderate | Moderate |

---

## When to use a policy engine

**Good fit:**
- Many microservices need the same rules
- Rules change often (compliance, legal)
- You need audit trails of policy versions
- ABAC rules too complex for inline `if` statements

**Poor fit:**
- Simple RBAC with 3 roles
- Single monolith, stable permissions
- Team has no appetite for new infrastructure

→ [RBAC](rbac.md) in code is fine until you feel pain.

---

## Architecture pattern

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Your API   │────▶│ Policy engine│────▶│ allow/deny  │
│  (Authentication ✓)  │     │ OPA / Cedar  │     └─────────────┘
└─────────────┘     └──────────────┘
                           ▲
                    policies in git
```

1. Authentication middleware identifies user
2. App builds input: user, action, resource
3. Engine evaluates → allow or deny
4. Handler runs only if allowed

---

## Policy engines vs ReBAC

| | Policy engine (OPA/Cedar) | ReBAC (OpenFGA/SpiceDB) |
|---|---------------------------|-------------------------|
| Model | Rules over attributes | Graph of relationships |
| Best question | "Does this rule match?" | "Is there a path in the graph?" |
| Sharing at scale | Possible but awkward | Native |
| Can combine | Yes — many teams use both | |

---

## Related docs

- [ABAC](abac.md) — what policy engines often implement
- [ReBAC](rebac.md) — complementary for relationship-heavy apps
- [Combining approaches](combining-approaches.md)
- [Production checklist](production-checklist.md)
