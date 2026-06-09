# ReBAC — Relationship-Based Access Control

**ReBAC** models permissions as **relationships** in a graph — inspired by [Google Zanzibar](https://research.google/pubs/pub48190/).

Instead of "Alice is an editor," you store:

```text
document:report#editor@user:alice
team:design#member@user:alice
folder:q4#parent@document:report
```

Access is computed by traversing relationships: "Alice is editor of report because she's on the team that owns the folder."

---

## How it works

```text
1. Define object types (user, team, folder, document)
2. Define relations (member, editor, viewer, parent)
3. Write tuples (relationship facts)
4. Check: "Does user:alice have relation editor on document:report?"
   → Engine walks the graph → allow/deny
```

**Tuple format:**

```text
user:alice → editor → document:report
team:design → owner → folder:q4
folder:q4 → parent → document:report
```

---

## Example: document sharing

**Setup:**

```text
team:eng#member@user:alice
team:eng#member@user:bob
folder:projects#owner@team:eng
document:spec#parent@folder:projects
document:spec#viewer@user:carol    ← explicit share
```

**Checks:**

```text
Can alice edit document:spec?
  → alice is member of eng
  → eng owns projects folder
  → spec is in projects
  → eng members can edit docs in their folders
  → ALLOW

Can carol edit document:spec?
  → carol is viewer only (explicit share)
  → DENY edit, ALLOW read
```

---

## ReBAC vs other models

| Need | RBAC | ACL | ReBAC |
|------|------|-----|-------|
| Org-wide admin role | ✓ | ✗ | ✓ |
| Share one doc with outsider | ✗ | ✓ | ✓ |
| Folder inherits to children | ✗ | manual | ✓ |
| "Users in team X edit team docs" | awkward | awkward | ✓ |
| Simple blog with 3 roles | ✓ | overkill | overkill |

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Natural sharing model** | Matches Drive, Notion, GitHub |
| **Hierarchy & inheritance** | Folder → file permissions flow down |
| **Consistent at scale** | Same model for 10 or 10M resources |
| **Fast checks** | Zanzibar-style engines optimize graph traversal |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Steep learning curve** | Schema design takes practice |
| **Infrastructure** | Usually a dedicated service (OpenFGA, SpiceDB) |
| **Overkill for simple apps** | RBAC is enough for many products |
| **Migration effort** | Moving from RBAC/ACL requires planning |

---

## When to use ReBAC

**Good fit:**
- Collaborative docs, design tools, project management
- Multi-tenant SaaS with workspaces, teams, folders
- Products where sharing is core (not an afterthought)
- GitHub-style "repo collaborator" permissions

**Poor fit:**
- Simple admin dashboard
- API-only product with scope-based access
- MVP before you understand sharing requirements

---

## Popular tools

| Tool | Notes |
|------|-------|
| [OpenFGA](https://github.com/openfga/openfga) | CNCF, Auth0 ecosystem, good SDKs |
| [SpiceDB](https://github.com/authzed/spicedb) | Zanzibar-faithful, strong consistency |
| Ory Keto | Part of Ory stack |
| Warrant | Hosted option |

Both use a **schema** (define types + relations) and a **tuple store** (relationship facts).

---

## Schema example (conceptual)

```text
type user

type team
  relations
    define member: [user]

type folder
  relations
    define owner: [team]
    define parent: [folder]

type document
  relations
    define parent: [folder]
    define viewer: [user]
    define editor: [user] or editor from parent
    define can_edit: editor
    define can_view: viewer or can_edit
```

Exact syntax differs between OpenFGA and SpiceDB — see their docs and playgrounds.

---

## ReBAC + RBAC

ReBAC often **includes** role-like relations:

```text
organization:acme#admin@user:alice   ← like RBAC admin
document:doc1#editor@user:bob        ← like ACL entry
```

ReBAC replaces both when relationships get complex.

---

## Migration tip: shadow mode

Run old and new checks in parallel:

```text
legacyRBAC = checkRole(user, action)
rebacResult = openfga.check(user, action, resource)

if legacyRBAC != rebacResult:
  log discrepancy   // fix model before cutover
```

---

## Related docs

- [ACL](acl.md) — simpler sharing, often evolves into ReBAC
- [RBAC](rbac.md) — org roles before graph model
- [Policy engines](policy-engines.md)
- [Combining approaches](combining-approaches.md)
