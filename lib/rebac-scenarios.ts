export type RebacTuple = {
  subject: string;
  relation: string;
  object: string;
};

export type RebacCheck = {
  user: string;
  action: string;
  resource: string;
  expected: boolean;
  explanation: string;
};

export type RebacScenario = {
  id: string;
  title: string;
  description: string;
  tuples: RebacTuple[];
  actionRelations: Record<string, string[]>;
  inheritance?: {
    parentRelation: string;
  };
  checks: RebacCheck[];
  rbacContrast?: string;
};

export const rebacScenarios: RebacScenario[] = [
  {
    id: "share-with-outsider",
    title: "Share a document with an outsider",
    description:
      "Alice owns a document and shares read-only access with Carol, who is not on the team.",
    tuples: [
      { subject: "user:alice", relation: "owner", object: "document:report" },
      { subject: "user:carol", relation: "viewer", object: "document:report" },
    ],
    actionRelations: {
      read: ["owner", "editor", "viewer"],
      edit: ["owner", "editor"],
      delete: ["owner"],
    },
    checks: [
      { user: "alice", action: "edit", resource: "document:report", expected: true, explanation: "Alice is owner." },
      { user: "carol", action: "read", resource: "document:report", expected: true, explanation: "Carol was explicitly shared as viewer." },
      { user: "carol", action: "edit", resource: "document:report", expected: false, explanation: "Viewer cannot edit — only read." },
      { user: "bob", action: "read", resource: "document:report", expected: false, explanation: "Bob has no relationship to this document." },
    ],
    rbacContrast:
      "With global RBAC, making Carol a viewer might let her read every document in the org — not just this one.",
  },
  {
    id: "team-folder-inheritance",
    title: "Team folder inheritance",
    description:
      "Engineering team owns a folder; documents inside inherit team member access.",
    tuples: [
      { subject: "user:alice", relation: "member", object: "team:eng" },
      { subject: "user:bob", relation: "member", object: "team:eng" },
      { subject: "team:eng", relation: "owner", object: "folder:projects" },
      { subject: "document:spec", relation: "parent", object: "folder:projects" },
    ],
    actionRelations: {
      read: ["member", "owner"],
      edit: ["member", "owner"],
      delete: ["owner"],
    },
    inheritance: { parentRelation: "parent" },
    checks: [
      { user: "alice", action: "edit", resource: "document:spec", expected: true, explanation: "Alice is on team:eng, which owns the parent folder." },
      { user: "bob", action: "read", resource: "document:spec", expected: true, explanation: "Bob inherits read via team membership." },
      { user: "carol", action: "read", resource: "document:spec", expected: false, explanation: "Carol is not on team:eng." },
    ],
    rbacContrast: "RBAC would need a custom rule per folder or a single org-wide editor role.",
  },
  {
    id: "demote-but-keep-share",
    title: "Demote user but keep explicit share",
    description: "Bob loses team membership but keeps access to one shared doc.",
    tuples: [
      { subject: "user:alice", relation: "member", object: "team:eng" },
      { subject: "team:eng", relation: "owner", object: "folder:projects" },
      { subject: "document:spec", relation: "parent", object: "folder:projects" },
      { subject: "user:bob", relation: "viewer", object: "document:spec" },
    ],
    actionRelations: {
      read: ["member", "owner", "viewer"],
      edit: ["member", "owner", "editor"],
      delete: ["owner"],
    },
    inheritance: { parentRelation: "parent" },
    checks: [
      { user: "bob", action: "read", resource: "document:spec", expected: true, explanation: "Explicit viewer share survives team removal." },
      { user: "bob", action: "edit", resource: "document:spec", expected: false, explanation: "Viewer share does not include edit." },
      { user: "bob", action: "read", resource: "document:other", expected: false, explanation: "No share on other docs in the folder." },
    ],
  },
  {
    id: "editor-not-owner",
    title: "Editor can edit but not delete",
    description: "Fine-grained relations on a single document.",
    tuples: [
      { subject: "user:alice", relation: "owner", object: "document:plan" },
      { subject: "user:bob", relation: "editor", object: "document:plan" },
    ],
    actionRelations: {
      read: ["owner", "editor", "viewer"],
      edit: ["owner", "editor"],
      delete: ["owner"],
    },
    checks: [
      { user: "bob", action: "edit", resource: "document:plan", expected: true, explanation: "Bob is editor." },
      { user: "bob", action: "delete", resource: "document:plan", expected: false, explanation: "Only owner can delete." },
    ],
  },
  {
    id: "workspace-guest",
    title: "Workspace guest vs member",
    description: "Guest sees one project; member sees all team projects.",
    tuples: [
      { subject: "user:dana", relation: "guest", object: "workspace:acme" },
      { subject: "user:eric", relation: "member", object: "workspace:acme" },
      { subject: "workspace:acme", relation: "parent", object: "project:alpha" },
      { subject: "project:beta", relation: "parent", object: "workspace:acme" },
      { subject: "user:dana", relation: "viewer", object: "project:alpha" },
    ],
    actionRelations: {
      read: ["member", "guest", "viewer"],
      edit: ["member"],
    },
    inheritance: { parentRelation: "parent" },
    checks: [
      { user: "dana", action: "read", resource: "project:alpha", expected: true, explanation: "Explicit viewer on project:alpha." },
      { user: "dana", action: "read", resource: "project:beta", expected: false, explanation: "Guest without explicit share cannot see other projects." },
      { user: "eric", action: "read", resource: "project:beta", expected: true, explanation: "Member inherits access to workspace projects." },
    ],
  },
];

export const WIZARD_REBAC_SCENARIO = "share-with-outsider";

export function getScenario(id: string): RebacScenario | undefined {
  return rebacScenarios.find((s) => s.id === id);
}

function userKey(user: string): string {
  return user.includes(":") ? user : `user:${user}`;
}

export function evaluateAccess(
  scenario: RebacScenario,
  user: string,
  action: string,
  resource: string,
): { allowed: boolean; reason: string } {
  const uk = userKey(user);
  const required = scenario.actionRelations[action] ?? [];

  for (const rel of required) {
    if (
      scenario.tuples.some(
        (t) => t.subject === uk && t.relation === rel && t.object === resource,
      )
    ) {
      return { allowed: true, reason: `Direct ${rel} on ${resource}.` };
    }
  }

  if (scenario.inheritance) {
    const parentLink = scenario.tuples.find(
      (t) => t.subject === resource && t.relation === scenario.inheritance!.parentRelation,
    );
    if (parentLink) {
      for (const t of scenario.tuples) {
        if (t.object !== parentLink.object) continue;
        if (t.relation === "owner" && t.subject.startsWith("team:")) {
          const onTeam = scenario.tuples.some(
            (m) => m.subject === uk && m.relation === "member" && m.object === t.subject,
          );
          if (onTeam && required.includes("member")) {
            return {
              allowed: true,
              reason: `Member of ${t.subject} which owns ${parentLink.object}.`,
            };
          }
        }
      }
      const parentGuest = scenario.tuples.some(
        (t) => t.subject === uk && t.relation === "guest" && t.object === parentLink.object,
      );
      if (parentGuest && required.includes("guest")) {
        return { allowed: true, reason: `Guest on parent ${parentLink.object}.` };
      }
      const parentMember = scenario.tuples.some(
        (t) => t.subject === uk && t.relation === "member" && t.object === parentLink.object,
      );
      if (parentMember && required.includes("member")) {
        return { allowed: true, reason: `Member on parent ${parentLink.object}.` };
      }
    }
  }

  return { allowed: false, reason: "No matching relationship for this action." };
}

export function runScenarioChecks(
  scenario: RebacScenario,
): Array<RebacCheck & { actual: boolean; match: boolean }> {
  return scenario.checks.map((check) => {
    const result = evaluateAccess(scenario, check.user, check.action, check.resource);
    return {
      ...check,
      actual: result.allowed,
      match: result.allowed === check.expected,
    };
  });
}
