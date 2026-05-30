"use client";

interface BadgeProps {
  children: React.ReactNode;
  colour?: string;
  className?: string;
}

export function Badge({ children, colour, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-border-subtle bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-secondary ${className}`}
      style={colour ? { color: colour, borderColor: `${colour}33` } : undefined}
    >
      {children}
    </span>
  );
}
