// ============================================================
// Profile background presets
// ------------------------------------------------------------
// Full-bleed background imagery is the one place images are
// allowed on the card. Presets are intentionally dark & subtle
// so the framed card + its scrim always stay legible.
//
// `branded` presets carry a faint ProCard shield watermark.
// The DEFAULT preset doubles as the house background watermark
// (rendered with the orange ambient glow) so a brand-new profile
// already looks branded.
// ============================================================

export interface BackgroundPreset {
  id: string;
  label: string;
  src: string;
  branded: boolean;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "branded-deep",
    label: "ProCard Deep",
    src: "/brand/backgrounds/branded-deep.svg",
    branded: true,
  },
  {
    id: "branded-grid",
    label: "ProCard Grid",
    src: "/brand/backgrounds/branded-grid.svg",
    branded: true,
  },
  {
    id: "grid",
    label: "Carbon Grid",
    src: "/brand/backgrounds/grid.svg",
    branded: false,
  },
  {
    id: "vignette",
    label: "Spotlight",
    src: "/brand/backgrounds/vignette.svg",
    branded: false,
  },
  {
    id: "angular",
    label: "Facets",
    src: "/brand/backgrounds/angular.svg",
    branded: false,
  },
];

/** The branded preset used as the house default watermark. */
export const DEFAULT_BACKGROUND_PRESET = "branded-deep";

/** Look up a preset by id, falling back to the default branded preset. */
export function getBackgroundPreset(id: string | null | undefined): BackgroundPreset {
  return (
    BACKGROUND_PRESETS.find((p) => p.id === id) ??
    BACKGROUND_PRESETS.find((p) => p.id === DEFAULT_BACKGROUND_PRESET) ??
    BACKGROUND_PRESETS[0]
  );
}
