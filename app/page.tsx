import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <span className="font-display text-lg font-bold tracking-[0.06em]">
          PROCARD<span className="text-accent-light">.GG</span>
        </span>
        <Link
          href="/login"
          className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-primary transition-all hover:bg-bg-elevated active:scale-[0.97]"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-light">
          For competitive players
        </p>
        <h1 className="font-display text-5xl font-bold leading-tight tracking-[0.03em] text-text-primary md:text-7xl">
          Your verified
          <br />
          esports identity.
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-text-secondary">
          One link with live ranks, team history, and socials.
          Verified directly from Riot, Faceit, and more.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-light active:scale-[0.97]"
          >
            Create your card
          </Link>
          <Link
            href="/midnight"
            className="rounded-lg border border-border-default px-6 py-3 text-sm font-medium text-text-secondary transition-all hover:bg-bg-elevated hover:text-text-primary active:scale-[0.97]"
          >
            See example
          </Link>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-border-subtle px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              01
            </p>
            <h3 className="mt-2 font-display text-lg font-bold tracking-[0.02em] text-text-primary">
              Live verified ranks
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
              Pulled from official APIs. Gold, Diamond, Immortal — always current, never faked.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              02
            </p>
            <h3 className="mt-2 font-display text-lg font-bold tracking-[0.02em] text-text-primary">
              One shareable link
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
              procard.gg/you — send it to scouts, teammates, orgs. Everything they need in 10 seconds.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              03
            </p>
            <h3 className="mt-2 font-display text-lg font-bold tracking-[0.02em] text-text-primary">
              Built for esports
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
              Team history, roles, socials, and status — designed for competitive players, not influencers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle px-6 py-8 text-center">
        <p className="text-xs text-text-muted">
          ProCard.gg — Your esports identity.
        </p>
      </footer>
    </main>
  );
}
