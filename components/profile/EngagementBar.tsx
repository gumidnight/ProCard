"use client";

import { useEffect, useState } from "react";
import { Eye, Heart, MessageSquare } from "lucide-react";

interface EngagementBarProps {
  slug: string;
  initialViews: number;
  initialLikes: number;
  initialLiked: boolean;
  commentCount: number;
  onCommentClick?: () => void;
}

/**
 * Shows view count + like toggle + comment count below the profile header.
 * Fires a one-time view ping on mount.
 */
export function EngagementBar({
  slug,
  initialViews,
  initialLikes,
  initialLiked,
  commentCount,
  onCommentClick,
}: EngagementBarProps) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);

  // Fire-and-forget view ping
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/profile/${slug}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: document.referrer || null }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && typeof data?.views === "number") {
          setViews(data.views);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggleLike = async () => {
    if (pending) return;
    setPending(true);
    // optimistic
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((n) => n + (nextLiked ? 1 : -1));
    try {
      const res = await fetch(`/api/profile/${slug}/like`, { method: "POST" });
      const data = await res.json();
      if (typeof data?.total === "number") setLikes(data.total);
      if (typeof data?.liked === "boolean") setLiked(data.liked);
    } catch {
      // revert
      setLiked(!nextLiked);
      setLikes((n) => n + (nextLiked ? -1 : 1));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-1 px-3 py-1.5 text-xs text-text-secondary">
        <Eye className="size-3.5" aria-hidden />
        <span className="font-mono tabular-nums">{views.toLocaleString()}</span>
        <span className="sr-only">views</span>
      </div>

      <button
        type="button"
        onClick={toggleLike}
        aria-pressed={liked}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
          liked
            ? "border-accent bg-accent-soft text-accent-hover"
            : "border-border-subtle bg-surface-1 text-text-secondary hover:border-border-default hover:text-text-primary"
        } disabled:opacity-50`}
      >
        <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} aria-hidden />
        <span className="font-mono tabular-nums">{likes.toLocaleString()}</span>
        <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
      </button>

      <button
        type="button"
        onClick={onCommentClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-1 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
      >
        <MessageSquare className="size-3.5" aria-hidden />
        <span className="font-mono tabular-nums">{commentCount.toLocaleString()}</span>
        <span className="sr-only">comments</span>
      </button>
    </div>
  );
}
