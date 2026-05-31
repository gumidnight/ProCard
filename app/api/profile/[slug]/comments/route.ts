import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileBySlug, findProfileByUserId } from "@/lib/db/profiles";
import {
  createComment,
  deleteCommentById,
  findCommentById,
  findCommentsByProfileId,
} from "@/lib/db/engagement";

interface Params {
  params: Promise<{ slug: string }>;
}

/** GET — list comments newest-first. */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const profile = await findProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ comments: await findCommentsByProfileId(profile.id) });
}

/** POST — add a comment (login required). */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }
  const profile = await findProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { body } = (await req.json().catch(() => ({}))) as {
    body?: unknown;
  };
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json(
      { error: "Comment too long (max 1000 chars)" },
      { status: 400 },
    );
  }

  const comment = await createComment({
    profile_id: profile.id,
    user_id: user.id,
    body: text,
  });

  return NextResponse.json(
    {
      comment: {
        ...comment,
        author_username: user.username,
        author_avatar_url: user.avatar_url,
        author_slug: (await findProfileByUserId(user.id))?.slug ?? null,
      },
    },
    { status: 201 },
  );
}

/** DELETE — remove a comment. Body: { id }. Allowed for author or profile owner. */
export async function DELETE(req: Request, { params }: Params) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = await findProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const comment = await findCommentById(id);
  if (!comment || comment.profile_id !== profile.id) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isOwner = profile.user_id === user.id;
  const isAuthor = comment.user_id === user.id;
  if (!isOwner && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteCommentById(id);
  return NextResponse.json({ success: true });
}
