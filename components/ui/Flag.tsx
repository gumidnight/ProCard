import Image from "next/image";

interface FlagProps {
  code: string;
  size?: number;
  className?: string;
}

/**
 * Country flag rendered as an SVG from flagcdn.com.
 * Windows browsers don't render flag emoji, so we rely on images instead.
 */
export function Flag({ code, size = 16, className }: FlagProps) {
  if (!code) return null;
  const lower = code.toLowerCase();
  const w = size;
  const h = Math.round(size * 0.75);
  return (
    <Image
      src={`https://flagcdn.com/${lower}.svg`}
      alt={`${code} flag`}
      width={w}
      height={h}
      className={`inline-block rounded-[2px] object-cover ${className ?? ""}`}
      unoptimized
    />
  );
}
