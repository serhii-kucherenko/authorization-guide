# ACL — Access Control Lists

An **ACL** is a list attached to each **resource** that says who can do what.

```text
document:123 → [
  alice: read, write,
  bob:   read,
  team-design: read
]
```

Think of a file's "Sharing" dialog — that's ACL thinking.

---

## How it works

```text
1. Each resource has an ACL (list of entries)
2. Each entry: subject (user/group) + permission(s)
3. On access: look up resource's ACL → is requester on the list with the right permission?
```

---

## Example

```text
GET /files/report-q4.pdf
  User: bob

ACL for report-q4.pdf:
  alice     → owner (read, write, delete, share)
  bob       → read
  carol     → read, write

bob has read → 200 OK

DELETE /files/report-q4.pdf
  User: bob

bob has read only, not delete → 403 Forbidden
```

---

## ACL vs RBAC

| | RBAC | ACL |
|---|------|-----|
| Permissions attached to | User's role (global) | Each resource |
| "Share one file with Bob" | Awkward | Natural |
| Admin panel | Natural | Awkward |
| Audit "who can access X?" | Hard | Easy (read the list) |

---

## Pros

| Pro | Why it matters |
|-----|----------------|
| **Intuitive for sharing** | Matches user mental model |
| **Per-resource control** | Exact list of who has access |
| **Simple for small scale** | Easy to implement and explain |
| **Easy "who has access?"** | Just read the ACL |

---

## Cons

| Con | Why it matters |
|-----|----------------|
| **Doesn't scale well** | Millions of files × many entries |
| **No global roles** | "Make Alice admin everywhere" is painful |
| **Group management** | Must expand groups on every check or sync |
| **Inheritance is manual** | Folder permissions don't flow to files unless you build it |

When ACLs grow complex (folders, teams, inheritance), teams often move to [ReBAC](rebac.md).

---

## When to use ACL

**Good fit:**
- Small apps with explicit sharing
- File storage, notes, simple collaboration
- Prototyping sharing before investing in ReBAC

**Poor fit:**
- Large org with role-based admin across all resources
- Deep folder hierarchies with inherited permissions
- "Anyone in team X can edit anything in workspace Y" at scale

---

## ACL entry structure

```text
{
  resource: "document:123",
  entries: [
    { subject: "user:alice", permissions: ["owner"] },
    { subject: "user:bob",   permissions: ["read"] },
    { subject: "group:design", permissions: ["read", "comment"] }
  ]
}
```

**Permission levels** (example):

| Level | Can do |
|-------|--------|
| read | View |
| comment | View + comment |
| write | View + edit |
| share | Write + add people |
| owner | Full control + delete |

---

## ACL → ReBAC migration path

ACLs often evolve:

```text
Stage 1: ACL per document (flat list)
Stage 2: ACL + groups (team-design)
Stage 3: Folder inheritance ("inherit from parent")
Stage 4: ReBAC graph (user → team → folder → document)
```

See [ReBAC](rebac.md) when inheritance and team relationships dominate.

---

## Related docs

- [RBAC](rbac.md) — org-wide roles
- [ReBAC](rebac.md) — ACL at scale with relationships
- [Decision guide](../01-decision-guide.md)
