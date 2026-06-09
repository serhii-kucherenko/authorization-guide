"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CompareCodeSection } from "@/components/compare-code-section";
import {
  buildComparison,
  getOptionsByCategory,
  type CompareOption,
} from "@/lib/comparisons";
import { slugToHref } from "@/lib/navigation";

type CompareToolProps = {
  initialA?: string;
  initialB?: string;
  initialCategory?: "authentication" | "authorization";
};

export function CompareTool({
  initialA,
  initialB,
  initialCategory = "authorization",
}: CompareToolProps) {
  const [category, setCategory] = useState<CompareOption["category"]>(initialCategory);
  const options = useMemo(() => getOptionsByCategory(category), [category]);
  const [aId, setAId] = useState(initialA ?? options[0]?.id ?? "");
  const [bId, setBId] = useState(initialB ?? options[1]?.id ?? "");

  const filteredOptions = getOptionsByCategory(category);
  const optionA = filteredOptions.find((o) => o.id === aId) ?? filteredOptions[0];
  const optionB = filteredOptions.find((o) => o.id === bId) ?? filteredOptions[1];

  const dimensions = optionA && optionB ? buildComparison(optionA, optionB) : [];

  function switchCategory(next: CompareOption["category"]) {
    setCategory(next);
    const opts = getOptionsByCategory(next);
    setAId(opts[0]?.id ?? "");
    setBId(opts[1]?.id ?? "");
  }

  if (!optionA || !optionB) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {(["authentication", "authorization"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => switchCategory(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              category === cat
                ? "bg-accent text-white"
                : "border border-border bg-card text-ink-muted hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectBox label="Option A" value={aId} options={filteredOptions} onChange={setAId} />
        <SelectBox
          label="Option B"
          value={bId}
          options={filteredOptions.filter((o) => o.id !== aId)}
          onChange={setBId}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper-dark">
              <th className="px-4 py-3 text-left font-semibold text-ink">Dimension</th>
              <th className="px-4 py-3 text-left font-semibold text-accent">{optionA.label}</th>
              <th className="px-4 py-3 text-left font-semibold text-accent">{optionB.label}</th>
            </tr>
          </thead>
          <tbody>
            {dimensions.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{row.label}</td>
                <td className="px-4 py-3 text-ink-muted">{row.a}</td>
                <td className="px-4 py-3 text-ink-muted">{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ProsConsCard option={optionA} />
        <ProsConsCard option={optionB} />
      </div>

      <CompareCodeSection
        optionA={{
          label: optionA.label,
          language: optionA.codeSample.language,
          code: optionA.codeSample.code,
        }}
        optionB={{
          label: optionB.label,
          language: optionB.codeSample.language,
          code: optionB.codeSample.code,
        }}
      />

      <div className="flex flex-wrap gap-3">
        <Link href={slugToHref(optionA.docSlug)} className="text-sm font-medium text-accent underline">
          Read {optionA.label} guide →
        </Link>
        <Link href={slugToHref(optionB.docSlug)} className="text-sm font-medium text-accent underline">
          Read {optionB.label} guide →
        </Link>
      </div>
    </div>
  );
}

function SelectBox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: CompareOption[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-ink"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProsConsCard({ option }: { option: CompareOption }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-semibold text-ink">{option.label}</h3>
      <p className="mb-4 text-sm text-ink-muted">{option.example}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-accent">Pros</p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-ink-muted">
            {option.pros.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-ink-muted">Cons</p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-ink-muted">
            {option.cons.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
