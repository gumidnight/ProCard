import { Check, X } from "lucide-react";
import { Reveal } from "./Reveal";

interface Row {
  label: string;
  procard: boolean;
  linktree: boolean;
  statsSite: boolean;
}

const ROWS: Row[] = [
  { label: "Live verified ranks", procard: true, linktree: false, statsSite: true },
  { label: "Multi-game in one place", procard: true, linktree: false, statsSite: false },
  { label: "Team history and roles", procard: true, linktree: false, statsSite: false },
  { label: "Shareable as identity", procard: true, linktree: true, statsSite: false },
  { label: "Status: open to offers", procard: true, linktree: false, statsSite: false },
  { label: "Built for esports", procard: true, linktree: false, statsSite: true },
];

function Cell({ value }: { value: boolean }) {
  return value ? (
    <Check className="mx-auto size-4 text-accent" strokeWidth={2.5} />
  ) : (
    <X className="mx-auto size-4 text-text-muted" strokeWidth={2} />
  );
}

export function ComparisonSection() {
  return (
    <section id="comparison" className="bg-surface-0">
      <div className="mx-auto max-w-2xl px-6 py-24">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Why ProCard
          </p>
          <h2 className="mt-3 font-display text-[32px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            A bio link wasn&rsquo;t built for this.
          </h2>
        </Reveal>

        <Reveal
          delay={0.1}
          className="mt-12 overflow-hidden rounded-[var(--radius-lg)] border border-border-default"
        >
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="bg-surface-2">
                <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted"></th>
                <th className="px-4 py-3 text-center font-display text-[13px] font-bold tracking-[0.04em] text-accent">
                  ProCard
                </th>
                <th className="px-4 py-3 text-center font-display text-[13px] font-bold tracking-[0.04em] text-text-secondary">
                  Linktree
                </th>
                <th className="px-4 py-3 text-center font-display text-[13px] font-bold tracking-[0.04em] text-text-secondary">
                  OP.GG / Tracker
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border-subtle">
                  <td className="px-4 py-3 text-text-primary">{row.label}</td>
                  <td className="px-4 py-3">
                    <Cell value={row.procard} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={row.linktree} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={row.statsSite} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
