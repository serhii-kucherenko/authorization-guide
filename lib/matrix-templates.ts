export type MatrixTemplate = {
  id: string;
  name: string;
  description: string;
  roles: string[];
  permissions: string[];
  grants: Record<string, string[]>;
  ownershipRule?: boolean;
};

export const matrixTemplates: MatrixTemplate[] = [
  {
    id: "blog-cms",
    name: "Blog / CMS",
    description: "Content publishing with admin, editor, and reader roles.",
    roles: ["admin", "editor", "viewer"],
    permissions: ["posts:read", "posts:write", "posts:delete", "posts:publish", "users:manage", "settings:manage"],
    grants: {
      admin: ["posts:read", "posts:write", "posts:delete", "posts:publish", "users:manage", "settings:manage"],
      editor: ["posts:read", "posts:write", "posts:publish"],
      viewer: ["posts:read"],
    },
    ownershipRule: true,
  },
  {
    id: "b2b-saas",
    name: "B2B SaaS admin",
    description: "Multi-tenant dashboard with org owner, member, and guest.",
    roles: ["owner", "admin", "member", "guest"],
    permissions: ["org:read", "org:manage", "billing:manage", "members:invite", "members:remove", "data:read", "data:write", "data:delete"],
    grants: {
      owner: ["org:read", "org:manage", "billing:manage", "members:invite", "members:remove", "data:read", "data:write", "data:delete"],
      admin: ["org:read", "org:manage", "members:invite", "members:remove", "data:read", "data:write", "data:delete"],
      member: ["org:read", "data:read", "data:write"],
      guest: ["org:read", "data:read"],
    },
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Storefront customers plus staff roles for orders and catalog.",
    roles: ["customer", "support", "manager", "admin"],
    permissions: ["orders:read", "orders:refund", "catalog:read", "catalog:write", "users:read", "users:manage", "reports:view"],
    grants: {
      customer: ["orders:read", "catalog:read"],
      support: ["orders:read", "orders:refund", "catalog:read", "users:read"],
      manager: ["orders:read", "orders:refund", "catalog:read", "catalog:write", "users:read", "reports:view"],
      admin: ["orders:read", "orders:refund", "catalog:read", "catalog:write", "users:read", "users:manage", "reports:view"],
    },
    ownershipRule: true,
  },
  {
    id: "support-desk",
    name: "Support / helpdesk",
    description: "Ticket system with agent tiers and read-only audit.",
    roles: ["agent", "senior-agent", "supervisor", "auditor"],
    permissions: ["tickets:read", "tickets:reply", "tickets:close", "tickets:assign", "tickets:delete", "reports:read", "users:impersonate"],
    grants: {
      agent: ["tickets:read", "tickets:reply"],
      "senior-agent": ["tickets:read", "tickets:reply", "tickets:close", "tickets:assign"],
      supervisor: ["tickets:read", "tickets:reply", "tickets:close", "tickets:assign", "tickets:delete", "reports:read"],
      auditor: ["tickets:read", "reports:read"],
    },
  },
  {
    id: "dev-api",
    name: "Developer API dashboard",
    description: "Human dashboard users plus implied API scope separation.",
    roles: ["developer", "team-lead", "billing-admin", "org-admin"],
    permissions: ["api-keys:read", "api-keys:create", "api-keys:revoke", "usage:read", "billing:read", "billing:manage", "team:manage"],
    grants: {
      developer: ["api-keys:read", "api-keys:create", "usage:read"],
      "team-lead": ["api-keys:read", "api-keys:create", "api-keys:revoke", "usage:read", "team:manage"],
      "billing-admin": ["usage:read", "billing:read", "billing:manage"],
      "org-admin": ["api-keys:read", "api-keys:create", "api-keys:revoke", "usage:read", "billing:read", "billing:manage", "team:manage"],
    },
  },
  {
    id: "internal-hr",
    name: "Internal HR tool",
    description: "Sensitive employee records with department-scoped access.",
    roles: ["employee", "manager", "hr", "executive"],
    permissions: ["profile:read-own", "profile:read-team", "profile:read-all", "profile:edit", "payroll:read", "payroll:edit", "audit:read"],
    grants: {
      employee: ["profile:read-own"],
      manager: ["profile:read-own", "profile:read-team"],
      hr: ["profile:read-own", "profile:read-all", "profile:edit", "payroll:read", "payroll:edit"],
      executive: ["profile:read-all", "audit:read"],
    },
    ownershipRule: true,
  },
  {
    id: "project-mgmt",
    name: "Project management",
    description: "Workspace roles plus project-level contributor access.",
    roles: ["workspace-guest", "contributor", "project-admin", "workspace-admin"],
    permissions: ["projects:read", "projects:create", "tasks:read", "tasks:write", "tasks:delete", "members:manage", "workspace:settings"],
    grants: {
      "workspace-guest": ["projects:read", "tasks:read"],
      contributor: ["projects:read", "tasks:read", "tasks:write"],
      "project-admin": ["projects:read", "projects:create", "tasks:read", "tasks:write", "tasks:delete", "members:manage"],
      "workspace-admin": ["projects:read", "projects:create", "tasks:read", "tasks:write", "tasks:delete", "members:manage", "workspace:settings"],
    },
    ownershipRule: true,
  },
  {
    id: "lms",
    name: "Education / LMS",
    description: "Courses with student, instructor, and admin roles.",
    roles: ["student", "instructor", "ta", "admin"],
    permissions: ["courses:read", "courses:edit", "assignments:submit", "assignments:grade", "roster:manage", "grades:view-all"],
    grants: {
      student: ["courses:read", "assignments:submit"],
      instructor: ["courses:read", "courses:edit", "assignments:grade", "roster:manage"],
      ta: ["courses:read", "assignments:grade"],
      admin: ["courses:read", "courses:edit", "assignments:grade", "roster:manage", "grades:view-all"],
    },
  },
  {
    id: "healthcare-admin",
    name: "Healthcare admin (basic)",
    description: "Clinical staff tiers with strict read/write separation.",
    roles: ["reception", "nurse", "physician", "admin"],
    permissions: ["patients:read", "patients:write", "records:read", "records:write", "prescriptions:write", "audit:read"],
    grants: {
      reception: ["patients:read"],
      nurse: ["patients:read", "records:read", "records:write"],
      physician: ["patients:read", "patients:write", "records:read", "records:write", "prescriptions:write"],
      admin: ["patients:read", "audit:read"],
    },
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buyers, sellers, moderators, and platform admin.",
    roles: ["buyer", "seller", "moderator", "platform-admin"],
    permissions: ["listings:read", "listings:create", "listings:edit", "orders:read", "orders:fulfill", "disputes:resolve", "users:suspend", "fees:configure"],
    grants: {
      buyer: ["listings:read", "orders:read"],
      seller: ["listings:read", "listings:create", "listings:edit", "orders:read", "orders:fulfill"],
      moderator: ["listings:read", "listings:edit", "orders:read", "disputes:resolve", "users:suspend"],
      "platform-admin": ["listings:read", "listings:create", "listings:edit", "orders:read", "orders:fulfill", "disputes:resolve", "users:suspend", "fees:configure"],
    },
    ownershipRule: true,
  },
];

export type MatrixState = {
  roles: string[];
  permissions: string[];
  grants: Record<string, string[]>;
  ownershipRule: boolean;
  templateId?: string;
};

export function templateToState(template: MatrixTemplate): MatrixState {
  return {
    roles: [...template.roles],
    permissions: [...template.permissions],
    grants: JSON.parse(JSON.stringify(template.grants)) as Record<string, string[]>,
    ownershipRule: template.ownershipRule ?? false,
    templateId: template.id,
  };
}

export function emptyMatrixState(): MatrixState {
  return {
    roles: ["admin", "editor", "viewer"],
    permissions: ["items:read", "items:write", "items:delete"],
    grants: {
      admin: ["items:read", "items:write", "items:delete"],
      editor: ["items:read", "items:write"],
      viewer: ["items:read"],
    },
    ownershipRule: false,
  };
}

export function validateMatrix(state: MatrixState): string[] {
  const warnings: string[] = [];

  for (const role of state.roles) {
    const perms = state.grants[role] ?? [];
    if (perms.length === 0) {
      warnings.push(`Role "${role}" has no permissions.`);
    }
  }

  for (const perm of state.permissions) {
    const hasRole = state.roles.some((r) => (state.grants[r] ?? []).includes(perm));
    if (!hasRole) {
      warnings.push(`Permission "${perm}" is not granted to any role.`);
    }
  }

  const seenRoles = new Set<string>();
  for (const role of state.roles) {
    if (seenRoles.has(role)) warnings.push(`Duplicate role "${role}".`);
    seenRoles.add(role);
  }

  return warnings;
}
