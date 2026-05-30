"use client";

import { ESPORTS_ROLES } from "@/lib/constants/esports-roles";

interface RoleChipPickerProps {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}

/**
 * Multi-select chip picker for esports roles.
 * Click a chip to toggle membership. Selected chips use the accent style.
 */
export function RoleChipPicker({
  label = "Esports Roles",
  value,
  onChange,
  hint,
}: RoleChipPickerProps) {
  const selected = new Set(value);

  const toggle = (role: string) => {
    const next = new Set(selected);
    if (next.has(role)) next.delete(role);
    else next.add(role);
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          {label}
        </label>
        {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ESPORTS_ROLES.map((r) => {
          const active = selected.has(r.value);
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => toggle(r.value)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-accent-hover"
                  : "border-border-subtle bg-surface-2 text-text-secondary hover:border-border-default hover:text-text-primary"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
