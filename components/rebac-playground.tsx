"use client";

import { useEffect, useMemo, useState } from "react";
import {
  evaluateAccess,
  getScenario,
  rebacScenarios,
  runScenarioChecks,
  type RebacScenario,
} from "@/lib/rebac-scenarios";

type RebacPlaygroundProps = {
  initialScenarioId?: string;
};

export function RebacPlayground({ initialScenarioId }: RebacPlaygroundProps) {
  const [scenarioId, setScenarioId] = useState(
    initialScenarioId ?? rebacScenarios[0].id,
  );
  const [user, setUser] = useState("alice");
  const [action, setAction] = useState("read");
  const [resource, setResource] = useState("");

  useEffect(() => {
    if (initialScenarioId) {
      setScenarioId(initialScenarioId);
      setResource("");
    }
  }, [initialScenarioId]);

  const scenario = getScenario(scenarioId) ?? rebacScenarios[0];
  const checkResults = useMemo(() => runScenarioChecks(scenario), [scenario]);
  const allPass = checkResults.every((c) => c.match);

  const liveResult = resource
    ? evaluateAccess(scenario, user, action, resource)
    : null;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold text-ink">Choose a scenario</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {rebacScenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setScenarioId(s.id);
                setResource("");
              }}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                scenarioId === s.id
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-paper hover:border-accent/40"
              }`}
            >
              <span className="block font-medium text-ink">{s.title}</span>
              <span className="text-xs text-ink-muted">{s.description}</span>
            </button>
          ))}
        </div>
      </section>

      <ScenarioDetail scenario={scenario} allPass={allPass} checkResults={checkResults} />

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold text-ink">Try your own check</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="User" value={user} onChange={setUser} placeholder="alice" />
          <Field label="Action" value={action} onChange={setAction} placeholder="read" />
          <Field
            label="Resource"
            value={resource}
            onChange={setResource}
            placeholder={scenario.tuples[0]?.object ?? "document:report"}
          />
        </div>
        {liveResult && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 ${
              liveResult.allowed
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <p className="font-semibold">{liveResult.allowed ? "Allow" : "Deny"}</p>
            <p className="text-sm">{liveResult.reason}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ink-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2"
      />
    </label>
  );
}

function ScenarioDetail({
  scenario,
  allPass,
  checkResults,
}: {
  scenario: RebacScenario;
  allPass: boolean;
  checkResults: ReturnType<typeof runScenarioChecks>;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-lg font-semibold text-ink">{scenario.title}</h2>
        <p className="text-sm text-ink-muted">{scenario.description}</p>
        {scenario.rbacContrast && (
          <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-ink-muted">
            <strong className="text-ink">Why not RBAC alone?</strong> {scenario.rbacContrast}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Relationship tuples
        </h3>
        <ul className="space-y-1 font-mono text-xs text-ink">
          {scenario.tuples.map((t) => (
            <li key={`${t.subject}-${t.relation}-${t.object}`} className="rounded bg-paper px-2 py-1">
              {t.subject} → {t.relation} → {t.object}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Scenario checks
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              allPass ? "bg-accent-soft text-accent" : "bg-amber-100 text-amber-800"
            }`}
          >
            {allPass ? "All pass" : "Review evaluator"}
          </span>
        </div>
        <div className="space-y-2">
          {checkResults.map((check) => (
            <div
              key={`${check.user}-${check.action}-${check.resource}`}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-paper px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-ink">
                  {check.user} → {check.action} → {check.resource}
                </span>
                <p className="text-xs text-ink-muted">{check.explanation}</p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                  check.expected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                expect {check.expected ? "allow" : "deny"}
                {check.match ? " ✓" : " ✗"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
