"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section";
}

/**
 * Scroll-triggered fade + lift. Cheap, brand-appropriate, no parallax.
 * Framer Motion respects `prefers-reduced-motion` automatically via
 * `MotionConfig` defaults — we don't branch here so SSR/CSR markup matches.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const MotionTag = as === "section" ? motion.section : motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
