"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, forwardRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { formatRelative } from "@/lib/utils/time";
import type { ProfileCommentWithAuthor } from "@/types/db";

interface CommentsSectionProps {
  slug: string;
  initialComments: ProfileCommentWithAuthor[];
  /** Current viewer's user id, or null if signed out. */
  currentUserId: string | null;
  /** True if the viewer owns this profile (can moderate any comment). */
  isOwner: boolean;
}

/** Endorsers shown as chips before the "+N more" expander kicks in. */
const STRIP_CAP = 10;
/** How long each endorsement is featured before rotating (ms). */
const ROTATE_INTERVAL = 4200;
/** Crossfade duration between endorsements (ms). */
const FADE_MS = 280;

function Avatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  return (
    <span
      className="block shrink-0 overflow-hidden rounded-full border border-border-subtle bg-surface-2"
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] text-text-muted">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export const CommentsSection = forwardRef<HTMLElement, CommentsSectionProps>(
  function CommentsSection({ slug, initialComments, currentUserId, isOwner }, ref) {
    const [comments, setComments] = useState(initialComments);
    const [draft, setDraft] = useState("");
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string>();
    const [expanded, setExpanded] = useState(false);

    // Featured-endorsement rotator
    const [active, setActive] = useState(0);
    const [fading, setFading] = useState(false);
    const hoverRef = useRef(false);
    const expandedRef = useRef(false);
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
      expandedRef.current = expanded;
    }, [expanded]);

    useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const sync = () => setReduced(mq.matches);
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }, []);

    // Auto-advance the featured endorsement with a crossfade.
    useEffect(() => {
      if (reduced || comments.length < 2) return;
      let swap: ReturnType<typeof setTimeout>;
      const tick = setInterval(() => {
        if (hoverRef.current || expandedRef.current) return;
        setFading(true);
        swap = setTimeout(() => {
          setActive((i) => (i + 1) % comments.length);
          setFading(false);
        }, FADE_MS);
      }, ROTATE_INTERVAL);
      return () => {
        clearInterval(tick);
        clearTimeout(swap);
      };
    }, [reduced, comments.length]);

    const submit = async () => {
      const text = draft.trim();
      if (!text || posting) return;
      setPosting(true);
      setError(undefined);
      try {
        const res = await fetch(`/api/profile/${slug}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to post");
          return;
        }
        // Surface the new endorsement as the featured one.
        setComments((prev) => [data.comment, ...prev]);
        setActive(0);
        setDraft("");
      } catch {
        setError("Network error");
      } finally {
        setPosting(false);
      }
    };

    const remove = async (id: string) => {
      const prev = comments;
      setComments((c) => c.filter((x) => x.id !== id));
      try {
        const res = await fetch(`/api/profile/${slug}/comments`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) setComments(prev);
      } catch {
        setComments(prev);
      }
    };

    const canDelete = (c: ProfileCommentWithAuthor) =>
      isOwner || c.user_id === currentUserId;

    const nameLink = (c: ProfileCommentWithAuthor, className: string) =>
      c.author_slug ? (
        <Link href={`/${c.author_slug}`} className={className}>
          {c.author_username}
        </Link>
      ) : (
        <span className={className}>{c.author_username}</span>
      );

    const activeIdx = comments.length ? active % comments.length : 0;
    const featured = comments[activeIdx];
    const overflow = comments.length > STRIP_CAP;

    // Jump the rotator to a specific endorsement (chip click).
    const focusEndorsement = (idx: number) => {
      if (idx === activeIdx) return;
      setFading(true);
      setTimeout(() => {
        setActive(idx);
        setFading(false);
      }, FADE_MS);
    };

    return (
      <section ref={ref} id="comments" className="flex flex-col gap-4 scroll-mt-20">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-text-secondary">
            Endorsements
          </h2>
          <span className="font-mono text-[11px] text-text-muted">{comments.length}</span>
        </header>

        {/* Composer / sign-in — kept directly under the header */}
        {currentUserId ? (
          <div className="flex flex-col gap-2 rounded-[10px] border border-border-subtle bg-surface-1 p-3">
            <TextArea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Leave an endorsement for this player…"
              maxLength={1000}
              charCount
              rows={3}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex justify-end">
              <Button onClick={submit} isLoading={posting} disabled={!draft.trim()}>
                Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-border-subtle bg-surface-1 p-4 text-center text-xs text-text-muted">
            <Link
              href="/login"
              className="text-accent-hover underline-offset-2 hover:underline"
            >
              Sign in
            </Link>{" "}
            to leave an endorsement.
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-xs text-text-muted">No endorsements yet.</p>
        ) : (
          <>
            {/* Featured endorsement — auto-rotating pull-quote */}
            <figure
              className="border-l-2 border-accent pl-3"
              onMouseEnter={() => (hoverRef.current = true)}
              onMouseLeave={() => (hoverRef.current = false)}
            >
              <div
                className="min-h-[3.25rem] transition-[opacity,transform] ease-out"
                style={{
                  transitionDuration: `${FADE_MS}ms`,
                  opacity: fading ? 0 : 1,
                  transform: fading ? "translateY(4px)" : "translateY(0)",
                }}
              >
                <blockquote className="line-clamp-4 whitespace-pre-wrap break-words text-[15px] leading-snug text-text-primary">
                  {featured.body}
                </blockquote>
                <figcaption className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-text-muted">
                  {nameLink(
                    featured,
                    "text-text-secondary transition-colors hover:text-text-primary",
                  )}
                  <span aria-hidden>·</span>
                  <span>{formatRelative(featured.created_at)}</span>
                  {canDelete(featured) && (
                    <button
                      onClick={() => remove(featured.id)}
                      className="ml-auto text-text-muted transition-colors hover:text-red-400"
                      title="Delete"
                      aria-label="Delete endorsement"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </figcaption>
              </div>
            </figure>

            {/* Voucher wall */}
            {comments.length > 1 && (
              <div className="flex flex-col gap-2.5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Vouched by
                </p>

                {expanded ? (
                  <>
                    <ul className="max-h-72 divide-y divide-border-subtle overflow-y-auto rounded-[10px] border border-border-subtle bg-surface-1">
                      {comments.map((c) => (
                        <li
                          key={c.id}
                          className="group flex items-start gap-2.5 px-3 py-2.5"
                        >
                          <span className="mt-0.5">
                            <Avatar
                              url={c.author_avatar_url}
                              name={c.author_username}
                              size={24}
                            />
                          </span>
                          <p className="min-w-0 flex-1 text-[13px] leading-snug text-text-secondary">
                            {nameLink(
                              c,
                              "text-[13px] font-semibold text-text-primary hover:underline",
                            )}
                            <span className="mx-1.5 font-mono text-[10px] text-text-muted">
                              {formatRelative(c.created_at)}
                            </span>
                            <span className="whitespace-pre-wrap break-words">
                              {c.body}
                            </span>
                          </p>
                          {canDelete(c) && (
                            <button
                              onClick={() => remove(c.id)}
                              className="mt-0.5 shrink-0 text-text-muted opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                              title="Delete"
                              aria-label="Delete endorsement"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setExpanded(false)}
                      className="self-start font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary"
                    >
                      Show less
                    </button>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {comments.slice(0, STRIP_CAP).map((c, i) => {
                      const isActive = i === activeIdx;
                      const chip = (
                        <>
                          <Avatar
                            url={c.author_avatar_url}
                            name={c.author_username}
                            size={16}
                          />
                          <span className="max-w-[120px] truncate">
                            {c.author_username}
                          </span>
                        </>
                      );
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => focusEndorsement(i)}
                          aria-label={`Show ${c.author_username}'s endorsement`}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition-colors ${
                            isActive
                              ? "border-accent bg-accent-soft text-text-primary"
                              : "border-border-subtle bg-surface-1 text-text-secondary hover:border-border-default hover:text-text-primary"
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                    {overflow && (
                      <button
                        onClick={() => setExpanded(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-1 px-3 py-1 text-[11px] text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
                      >
                        {`+${comments.length - STRIP_CAP} more`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    );
  },
);
