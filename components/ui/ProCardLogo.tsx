interface ProCardLogoProps {
  size?: number;
  className?: string;
}

interface ProCardMarkProps extends ProCardLogoProps {
  /** "dark" = white+orange mark for dark UI (default). "light" = charcoal+orange for light bg. */
  variant?: "dark" | "light";
}

/**
 * ProCard mark — the shield + "P" monogram. Rendered from the brand PNG with a
 * transparent background, so it sits cleanly on any surface.
 * - dark variant  → /brand/mark.png       (white + orange, for dark UI)
 * - light variant → /brand/mark-light.png (charcoal + orange, for light bg)
 */
export function ProCardMark({
  size = 28,
  className,
  variant = "dark",
}: ProCardMarkProps) {
  const src = variant === "light" ? "/brand/mark-light.png" : "/brand/mark.png";
  return (
    // Static brand mark at a fixed size — plain <img> is intentional here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      className={className}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

/**
 * Verification seal — scalloped orange disc with a check. Reusable beside names
 * or the wordmark; signals the platform's "verified identity" promise.
 */
export function VerifiedBadge({ size = 16, className }: ProCardLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M12 0.6L14.65 2.98L18.16 2.41L19.1 5.84L22.37 7.26L21.3 10.66L23.28 13.62L20.55 15.9L20.62 19.47L17.08 19.91L15.21 22.94L12 21.4L8.79 22.94L6.92 19.91L3.38 19.47L3.45 15.9L0.72 13.62L2.7 10.66L1.63 7.26L4.9 5.84L5.84 2.41L9.35 2.98Z"
        fill="var(--accent)"
      />
      <path
        d="M7.5 12.2L10.7 15.2L16.5 8.8"
        stroke="var(--accent-on)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProCardLogoFullProps extends ProCardMarkProps {
  /** Render the orange ".GG" after PROCARD. Default true. */
  showDotGg?: boolean;
  /** Render the verification seal after the wordmark. Default false. */
  showBadge?: boolean;
  /** Render the "VERIFIED ESPORTS IDENTITY" tagline beneath. Default false. */
  showTagline?: boolean;
}

/**
 * Full lockup: shield mark + PROCARD.GG wordmark, with optional verification
 * badge and tagline. Used in nav, footer, and brand presentation surfaces.
 */
export function ProCardLogo({
  size = 24,
  className,
  variant = "dark",
  showDotGg = true,
  showBadge = false,
  showTagline = false,
}: ProCardLogoFullProps) {
  const wordmarkColor = variant === "light" ? "text-surface-0" : "text-text-primary";
  return (
    <span
      className={`inline-flex flex-col gap-1 ${className ?? ""}`}
      style={{ lineHeight: 1 }}
    >
      <span className="inline-flex items-center gap-2">
        <ProCardMark size={size} variant={variant} />
        <span
          className={`font-display text-[20px] font-bold tracking-[0.10em] ${wordmarkColor}`}
        >
          PROCARD
          {showDotGg && <span className="text-accent">.GG</span>}
        </span>
        {showBadge && <VerifiedBadge size={Math.round(size * 0.6)} />}
      </span>
      {showTagline && (
        <span
          className="font-sans text-[10px] font-medium uppercase text-text-secondary"
          style={{ letterSpacing: "0.4em", paddingLeft: size + 8 }}
        >
          Verified Esports Identity
        </span>
      )}
    </span>
  );
}
