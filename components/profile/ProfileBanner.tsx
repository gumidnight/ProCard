interface ProfileBannerProps {
  bannerKey: string | null;
  /** Height/extra classes for the strip (parent controls sizing). */
  className?: string;
}

/**
 * Banner strip across the top of the player card.
 *
 * `bannerKey` is normally an uploaded file key (served via the banner API).
 * As a convenience, a value starting with "/" is treated as a direct static
 * path (used by demo profiles, which have no uploaded file on disk).
 *
 * When there's no banner, renders a subtle branded placeholder rather than a
 * blank gap, so the card head still reads as a frame.
 */
export function ProfileBanner({ bannerKey, className }: ProfileBannerProps) {
  const src = bannerKey
    ? bannerKey.startsWith("/")
      ? bannerKey
      : `/api/profile/banner?key=${encodeURIComponent(bannerKey)}`
    : null;

  return (
    <div className={`relative w-full overflow-hidden bg-surface-2 ${className ?? ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        // Subtle placeholder: dark gradient + faint accent edge + grid hint.
        <div
          className="h-full w-full"
          style={{
            background: "linear-gradient(120deg, #14171F 0%, #1C2029 55%, #14171F 100%)",
          }}
        >
          <div
            aria-hidden
            className="h-full w-full opacity-[0.5]"
            style={{
              background:
                "radial-gradient(ellipse 50% 120% at 18% 0%, rgba(255,92,0,0.10), transparent 70%)",
            }}
          />
        </div>
      )}

      {/* Bottom fade so the overlapping avatar + name sit cleanly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(20,23,31,0.85) 100%)",
        }}
      />
    </div>
  );
}
