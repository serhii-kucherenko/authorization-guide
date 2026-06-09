# AUTH Guide

A practical guide to **authentication** and **authorization** — available as markdown docs and a Next.js site.

Created by **[Serhii Kucherenko](https://github.com/serhii-kucherenko)**.

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

## Run the site locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- **Home** — overview and navigation
- **Decision tool** — `/tool`
- **Docs** — `/docs/00-authentication-vs-authorization`, etc.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — no extra config needed
4. Deploy — you get a free `*.vercel.app` URL

Or with the CLI:

```bash
npx vercel
```

## Project structure

```text
authorization-guide/
├── app/              Next.js pages (site UI)
├── components/       UI components + decision wizard
├── docs/             Markdown source (also rendered on the site)
├── lib/              Content loading, navigation, decision logic
└── package.json
```

## Docs (markdown)

Markdown files live in `docs/` and are rendered at `/docs/*`. Edit the markdown — the site picks up changes on rebuild.

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

## Contributing

Keep explanations plain, include examples, and always list pros and cons. Issues and pull requests welcome.

---

Made by [Serhii Kucherenko](https://github.com/serhii-kucherenko).
