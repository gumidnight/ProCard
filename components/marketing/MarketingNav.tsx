"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProCardLogo } from "@/components/ui/ProCardLogo";
import { LoginDialog } from "./LoginDialog";

const SECTIONS = [
  { id: "verification", label: "Verification" },
  { id: "scenario", label: "Scenario" },
  { id: "gallery", label: "Gallery" },
  { id: "how-it-works", label: "How it works" },
];

export function MarketingNav() {
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const scrollLockRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onOpen = () => setLoginOpen(true);
    window.addEventListener("procard:open-login", onOpen);
    return () => window.removeEventListener("procard:open-login", onOpen);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLockRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        scrolled
          ? "border-b border-border-subtle bg-[rgba(11,13,18,0.72)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" aria-label="ProCard home">
          <ProCardLogo size={30} />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={() => {
                  setActive(s.id);
                  if (scrollLockRef.current) clearTimeout(scrollLockRef.current);
                  scrollLockRef.current = setTimeout(() => {
                    scrollLockRef.current = null;
                  }, 1000);
                }}
                className={`relative rounded-[var(--radius-sm)] px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  active === s.id
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {s.label}
                {active === s.id && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-accent"
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="hidden rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary sm:inline-flex"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-[13px] font-semibold text-[var(--accent-on)] shadow-[0_6px_20px_-10px_rgba(255,92,0,0.7)] transition-all hover:bg-accent-hover hover:shadow-[0_10px_28px_-10px_rgba(255,92,0,0.9)]"
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-[var(--accent-on)]"
              style={{ animation: "livePulse 1.6s ease-in-out infinite" }}
            />
            Claim your card
          </button>
        </div>
      </nav>
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
