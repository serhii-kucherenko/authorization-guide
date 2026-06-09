"use client";

import { useMemo, useState } from "react";
import { useLocalStorage } from "@/components/use-local-storage";
import {
  copyToClipboard,
  downloadTextFile,
  exportMatrixCasbin,
  exportMatrixJson,
  exportMatrixMarkdown,
  exportMatrixMiddleware,
} from "@/lib/matrix-export";
import {
  emptyMatrixState,
  matrixTemplates,
  templateToState,
  validateMatrix,
  type MatrixState,
} from "@/lib/matrix-templates";
import { STORAGE_KEYS } from "@/lib/storage";

export function MatrixBuilder() {
  const [state, setState] = useLocalStorage<MatrixState>(
    STORAGE_KEYS.matrix,
    emptyMatrixState(),
  );
  const [copyMsg, setCopyMsg] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPerm, setNewPerm] = useState("");

  const warnings = useMemo(() => validateMatrix(state), [state]);

  function loadTemplate(id: string) {
    const t = matrixTemplates.find((x) => x.id === id);
    if (t) setState(templateToState(t));
  }

  function toggleGrant(role: string, perm: string) {
    setState((prev) => {
      const current = prev.grants[role] ?? [];
      const next = current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm];
      return { ...prev, grants: { ...prev.grants, [role]: next } };
    });
  }

  function addRole() {
    const name = newRole.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name || state.roles.includes(name)) return;
    setState((prev) => ({
      ...prev,
      roles: [...prev.roles, name],
      grants: { ...prev.grants, [name]: [] },
    }));
    setNewRole("");
  }

  function removeRole(role: string) {
    setState((prev) => {
      const { [role]: _, ...restGrants } = prev.grants;
      return {
        ...prev,
        roles: prev.roles.filter((r) => r !== role),
        grants: restGrants,
      };
    });
  }

  function addPermission() {
    const name = newPerm.trim().toLowerCase().replace(/\s+/g, ":");
    if (!name || state.permissions.includes(name)) return;
    setState((prev) => ({
      ...prev,
      permissions: [...prev.permissions, name],
    }));
    setNewPerm("");
  }

  function removePermission(perm: string) {
    setState((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((p) => p !== perm),
      grants: Object.fromEntries(
        Object.entries(prev.grants).map(([role, perms]) => [
          role,
          perms.filter((p) => p !== perm),
        ]),
      ),
    }));
  }

  async function handleCopy(format: "json" | "markdown" | "casbin") {
    const map = {
      json: exportMatrixJson(state),
      markdown: exportMatrixMarkdown(state),
      casbin: exportMatrixCasbin(state),
    };
    const ok = await copyToClipboard(map[format]);
    setCopyMsg(ok ? `Copied ${format} to clipboard` : "Copy failed");
    setTimeout(() => setCopyMsg(""), 2000);
  }

  return (
    <div className="space-y-8">
      {/* 1. Templates */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 font-semibold text-ink">Load a template</h2>
        <p className="mb-4 text-sm text-ink-muted">10 common product patterns — customize after loading.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {matrixTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => loadTemplate(t.id)}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition hover:border-accent ${
                state.templateId === t.id
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-paper"
              }`}
            >
              <span className="block font-medium text-ink">{t.name}</span>
              <span className="text-xs text-ink-muted">{t.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Ownership rule extra */}
      <section className="rounded-xl border border-border bg-card p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={state.ownershipRule}
            onChange={(e) => setState((p) => ({ ...p, ownershipRule: e.target.checked }))}
            className="mt-1 h-4 w-4"
          />
          <div>
            <span className="font-medium text-ink">Ownership rule (ABAC-lite)</span>
            <p className="text-sm text-ink-muted">
              Resource owners can write/delete their own items even without role permission.
            </p>
          </div>
        </label>
      </section>

      {/* 3–4. Add role / permission */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Add role</h3>
          <div className="flex gap-2">
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="e.g. moderator"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button type="button" onClick={addRole} className="rounded-lg bg-accent px-3 py-2 text-sm text-white">
              Add
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Add permission</h3>
          <div className="flex gap-2">
            <input
              value={newPerm}
              onChange={(e) => setNewPerm(e.target.value)}
              placeholder="e.g. posts:publish"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button type="button" onClick={addPermission} className="rounded-lg bg-accent px-3 py-2 text-sm text-white">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* 5. Validation warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-semibold text-amber-900">Warnings</p>
          <ul className="list-disc pl-5 text-sm text-amber-800">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Matrix grid */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper-dark">
              <th className="px-3 py-2 text-left font-semibold text-ink">Permission</th>
              {state.roles.map((role) => (
                <th key={role} className="px-3 py-2 text-center font-semibold text-ink">
                  <div className="flex flex-col items-center gap-1">
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => removeRole(role)}
                      className="text-xs text-ink-muted hover:text-red-600"
                    >
                      remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.permissions.map((perm) => (
              <tr key={perm} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-mono text-xs text-ink">
                  <div className="flex items-center justify-between gap-2">
                    {perm}
                    <button
                      type="button"
                      onClick={() => removePermission(perm)}
                      className="text-ink-muted hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </td>
                {state.roles.map((role) => (
                  <td key={`${role}-${perm}`} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={(state.grants[role] ?? []).includes(perm)}
                      onChange={() => toggleGrant(role, perm)}
                      className="h-4 w-4"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export extras */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-ink">Export</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadTextFile("role-matrix.json", exportMatrixJson(state), "application/json")}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-paper-dark"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile("policies.csv", exportMatrixCasbin(state))}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-paper-dark"
          >
            Download Casbin CSV
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile("role-matrix.md", exportMatrixMarkdown(state))}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-paper-dark"
          >
            Download Markdown
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile("authorize.js", exportMatrixMiddleware(state))}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-paper-dark"
          >
            Download middleware snippet
          </button>
          <button type="button" onClick={() => handleCopy("json")} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-paper-dark">
            Copy JSON
          </button>
          <button type="button" onClick={() => handleCopy("markdown")} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-paper-dark">
            Copy Markdown
          </button>
          <button type="button" onClick={() => handleCopy("casbin")} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-paper-dark">
            Copy Casbin
          </button>
          <button
            type="button"
            onClick={() => setState(emptyMatrixState())}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-muted hover:bg-paper-dark"
          >
            Reset matrix
          </button>
        </div>
        {copyMsg && <p className="mt-3 text-sm text-accent">{copyMsg}</p>}
        <p className="mt-3 text-xs text-ink-muted">
          Matrix saved automatically in your browser (localStorage).
        </p>
      </section>
    </div>
  );
}
