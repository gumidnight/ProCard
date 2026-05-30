import {
  DEFAULT_BACKGROUND_PRESET,
  getBackgroundPreset,
} from "@/lib/constants/backgrounds";
import type { ProfileRow } from "@/types/db";

interface ProfileBackgroundProps {
  profile: ProfileRow;
  /**
   * When true, pin the background to the viewport (`fixed`) so it stays static
   * while page content scrolls over it. Defaults to `absolute`, which fills the
   * nearest positioned ancestor — used by the dashboard phone preview.
   */
  fixed?: boolean;
}

// The existing orange ambient glow, reused for the house "default" background.
const ORANGE_GLOW =
  "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,92,0,0.18) 0%, rgba(255,92,0,0.04) 50%, transparent 70%)";

/**
 * Absolutely-positioned background layer for the player card.
 *
 * Resolves per §3:
 *  - "custom"  → streamed uploaded image
 *  - "preset"  → preset image by id
 *  - "default" → house background = branded watermark preset + orange glow
 *
 * Always renders a dark scrim on top of the imagery so card content stays
 * legible over any background. Positions relative to the nearest positioned
 * ancestor, so it works both as a full-viewport backdrop and inside the phone
 * preview screen.
 */
export function ProfileBackground({ profile, fixed }: ProfileBackgroundProps) {
  const type = profile.background_type;

  let imageSrc: string | null = null;
  let showGlow = false;

  if (type === "custom" && profile.background_key) {
    imageSrc = `/api/profile/background?key=${encodeURIComponent(profile.background_key)}`;
  } else if (type === "preset") {
    imageSrc = getBackgroundPreset(profile.background_preset).src;
  } else {
    // House default: branded watermark preset + the orange ambient glow.
    imageSrc = getBackgroundPreset(DEFAULT_BACKGROUND_PRESET).src;
    showGlow = true;
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none inset-0 overflow-hidden ${fixed ? "fixed" : "absolute"}`}
    >
      {imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {showGlow && (
        <div
          className="absolute inset-x-0 top-0 h-[520px]"
          style={{ background: ORANGE_GLOW }}
        />
      )}

      {/* Dark scrim — keeps content readable over any background. On the public
          page (`fixed`) the card has its own opaque panel, so the scrim only
          needs to be light enough to let the imagery read in the margins. The
          phone preview renders content directly on the background, so it keeps
          a stronger scrim. */}
      <div
        className="absolute inset-0"
        style={{
          background: fixed
            ? "linear-gradient(180deg, rgba(11,13,18,0.30) 0%, rgba(11,13,18,0.48) 100%)"
            : "linear-gradient(180deg, rgba(11,13,18,0.55) 0%, rgba(11,13,18,0.74) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: fixed
            ? "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(11,13,18,0.45) 100%)"
            : "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(11,13,18,0.72) 100%)",
        }}
      />
    </div>
  );
}
