const ITEMS = [
  "LEAGUE OF LEGENDS",
  "VALORANT",
  "CS2",
  "FACEIT",
  "RIOT GAMES",
  "LCK",
  "LEC",
  "VCT",
  "ESL PRO LEAGUE",
];

/**
 * Infinite horizontal marquee of game / league / platform names.
 * Two duplicate tracks slide together so the loop is seamless.
 */
export function EsportsMarquee() {
  const row = (
    <div className="flex shrink-0 items-center gap-10 px-5">
      {ITEMS.map((name, i) => (
        <span
          key={`${name}-${i}`}
          className="flex items-center gap-3 font-display text-[13px] font-semibold uppercase tracking-[0.20em] text-text-muted"
        >
          {name}
          <span aria-hidden className="size-1 rounded-full bg-accent/60" />
        </span>
      ))}
    </div>
  );

  return (
    <section
      aria-hidden
      className="relative overflow-hidden border-y border-border-subtle bg-surface-1/40 py-4"
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface-0 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface-0 to-transparent" />
      <div className="flex w-max" style={{ animation: "marquee 38s linear infinite" }}>
        {row}
        {row}
      </div>
    </section>
  );
}
