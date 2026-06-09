import type { MatrixState } from "@/lib/matrix-templates";

export function exportMatrixJson(state: MatrixState): string {
  return JSON.stringify(
    {
      roles: state.roles.reduce<Record<string, string[]>>((acc, role) => {
        acc[role] = state.grants[role] ?? [];
        return acc;
      }, {}),
      ownershipRule: state.ownershipRule,
    },
    null,
    2,
  );
}

export function exportMatrixCasbin(state: MatrixState): string {
  const lines: string[] = ["p, role, permission"];

  for (const role of state.roles) {
    for (const perm of state.grants[role] ?? []) {
      lines.push(`p, ${role}, ${perm}`);
    }
  }

  lines.push("");
  lines.push("# Grouping (assign users to roles at runtime):");
  lines.push("# g, alice, admin");

  if (state.ownershipRule) {
    lines.push("");
    lines.push("# Add ABAC-style matcher in model for resource owner:");
    lines.push("# allow if r.sub == r.obj.owner");
  }

  return lines.join("\n");
}

export function exportMatrixMarkdown(state: MatrixState): string {
  const header = ["Permission", ...state.roles].join(" | ");
  const sep = ["---", ...state.roles.map(() => "---")].join(" | ");
  const rows = state.permissions.map((perm) => {
    const cells = state.roles.map((role) => {
      const has = (state.grants[role] ?? []).includes(perm);
      return has ? "✓" : "";
    });
    return [perm, ...cells].join(" | ");
  });

  let md = `# Role-permission matrix\n\n| ${header} |\n| ${sep} |\n`;
  for (const row of rows) {
    md += `| ${row} |\n`;
  }

  if (state.ownershipRule) {
    md += "\n**Ownership rule:** Resource owners may perform write/delete on their own resources regardless of role.\n";
  }

  return md;
}

export function exportMatrixMiddleware(state: MatrixState): string {
  const permEntries = state.permissions
    .map((p) => `    '${p}'`)
    .join(",\n");

  const roleBlocks = state.roles
    .map((role) => {
      const perms = (state.grants[role] ?? []).map((p) => `'${p}'`).join(", ");
      return `  ${role}: [${perms}]`;
    })
    .join(",\n");

  const ownership = state.ownershipRule
    ? `
function canAccess(user, permission, resource) {
  const rolePerms = rolePermissions[user.role] ?? [];
  if (rolePerms.includes(permission)) return true;
  if (resource?.ownerId === user.id && ['items:write', 'items:delete'].includes(permission)) {
    return true;
  }
  return false;
}`
    : `
function authorize(permission) {
  return (req, res, next) => {
    const perms = rolePermissions[req.user.role] ?? [];
    if (!perms.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}`;

  return `const rolePermissions = {
${roleBlocks}
};

const permissions = [
${permEntries}
];
${ownership}
`;
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
