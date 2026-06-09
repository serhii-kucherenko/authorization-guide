# AUTH Guide

A practical guide to **authentication** and **authorization** — available as markdown docs and a Next.js site.

**Live site:** [authorization-guide.vercel.app](https://authorization-guide.vercel.app)

## Docs

Markdown files live in `docs/` and are rendered on the site at `/docs/*`.

### Foundation

- [Authentication vs Authorization](docs/00-authentication-vs-authorization.md)
- [Decision guide](docs/01-decision-guide.md)

### Authentication

- [Sessions](docs/authentication/sessions.md)
- [JWT & bearer tokens](docs/authentication/jwt-and-bearer-tokens.md)
- [API keys](docs/authentication/api-keys.md)
- [OAuth & OIDC](docs/authentication/oauth-and-oidc.md)

### Authorization

- [RBAC](docs/authorization/rbac.md)
- [ABAC](docs/authorization/abac.md)
- [ACL](docs/authorization/acl.md)
- [Scopes](docs/authorization/scopes.md)
- [ReBAC](docs/authorization/rebac.md)
- [Policy engines](docs/authorization/policy-engines.md)
- [Combining approaches](docs/authorization/combining-approaches.md)
- [Production checklist](docs/authorization/production-checklist.md)

## What's inside

- Plain-language explanations with examples and pros/cons
- Clear separation between authentication (who) and authorization (what)
- Interactive **decision tool** — answer questions, get a recommended stack
- 16 topic guides: sessions, JWT, RBAC, ReBAC, policy engines, and more

## Interactive tools

| Tool | URL | Description |
|------|-----|-------------|
| Decision wizard | `/tool` | Pick your auth stack |
| Flowcharts | `/flows` | Visual decision trees |
| Compare | `/compare` | Side-by-side trade-offs |
| Checklist | `/checklist` | Pre-launch tracker (localStorage) |
| Matrix builder | `/matrix` | Roles × permissions + 10 templates |
| ReBAC scenarios | `/scenarios` | Sharing playground |
| All tools | `/tools` | Tool index |

## Project structure

```text
authorization-guide/
├── app/              Next.js pages (site UI)
├── components/       UI components + decision wizard
├── docs/             Markdown source (also rendered on the site)
├── lib/              Content loading, navigation, decision logic
└── package.json
```

## Contributing

Keep explanations plain, include examples, and always list pros and cons. Issues and pull requests welcome.

## Run the site locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
