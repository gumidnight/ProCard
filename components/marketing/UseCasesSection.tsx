import { User, Users, Mic2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "./Reveal";

const CASES = [
  {
    icon: User,
    visual: <StatusBadge status="open" />,
    title: "Free agent",
    body: "Stop sending tracker links in DMs. Your rank is live, your status says you're looking, and orgs can see everything they need in one click.",
  },
  {
    icon: Users,
    visual: <StatusBadge status="on_team" />,
    title: "On a roster",
    body: "A public page your org can actually use. Tournament programs, broadcast talent sheets, fan pages — one link covers all of it.",
  },
  {
    icon: Mic2,
    visual: (
      <div className="flex flex-wrap gap-1.5">
        <Badge>Coach</Badge>
        <Badge>Analyst</Badge>
        <Badge>Caster</Badge>
      </div>
    ),
    title: "Staff & broadcast",
    body: "Esports never had a standard profile format for non-players. Now it does. Role, team history, game expertise — on record.",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="border-y border-border-subtle bg-surface-1">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Who it&rsquo;s for
          </p>
          <h2 className="mt-3 font-display text-[32px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            Wherever you are in the scene.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CASES.map(({ icon: Icon, visual, title, body }, i) => (
            <Reveal
              key={title}
              delay={i * 0.08}
              className="group rounded-[var(--radius-lg)] border border-border-subtle bg-surface-0 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-default hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center justify-between">
                <div>{visual}</div>
                <Icon
                  className="size-5 text-text-secondary transition-colors duration-200 group-hover:text-text-primary"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mt-4 font-display text-[18px] font-semibold tracking-[0.02em] text-text-primary">
                {title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                {body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
