import { GALLERY_DEMOS, type DemoProfileBundle } from "@/lib/constants/demo-profiles";
import { GalleryCard } from "./GalleryCard";
import { Reveal } from "./Reveal";

export function GallerySection() {
  // Split into two rows scrolling in opposite directions
  const rowA = GALLERY_DEMOS;
  const rowB = [...GALLERY_DEMOS].reverse();

  return (
    <section id="gallery" className="border-t border-border-subtle bg-surface-0">
      <div className="mx-auto max-w-6xl px-6 pt-24">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Example cards
          </p>
          <h2 className="mt-3 font-display text-[32px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            One format. Every role.
          </h2>
          <p className="mt-3 max-w-[480px] text-[14px] leading-relaxed text-text-secondary">
            Players, coaches, casters, analysts. The same card surface, tuned to what each
            role needs to show.
          </p>
        </Reveal>
      </div>

      <div className="mt-12 flex flex-col gap-5 pb-24">
        <MarqueeRow items={rowA} direction="left" duration={48} />
        <MarqueeRow items={rowB} direction="right" duration={56} />
      </div>
    </section>
  );
}

interface MarqueeRowProps {
  items: DemoProfileBundle[];
  direction: "left" | "right";
  duration: number;
}

function MarqueeRow({ items, direction, duration }: MarqueeRowProps) {
  // Duplicate the list so the loop is seamless
  const track = [...items, ...items];
  return (
    <div className="group relative overflow-hidden">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface-0 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface-0 to-transparent" />

      <div
        className="flex w-max gap-4 px-6 [animation-play-state:running] hover:[animation-play-state:paused]"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {track.map((bundle, i) => (
          <GalleryCard key={`${bundle.profile.id}-${i}`} bundle={bundle} />
        ))}
      </div>
    </div>
  );
}
