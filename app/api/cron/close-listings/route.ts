import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/app-url";
import { notifySoldWinners } from "@/lib/email/listings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header) {
    return false;
  }

  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(given, expected);
}

function isMissingRpc(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("could not find the function")
  );
}

async function tickListings(request: Request) {
  try {
    const supabase = createAdminClient();
    const notes: string[] = [];

    const opened = await supabase.rpc("open_due_listings");
    let openedCount = 0;
    if (opened.error) {
      if (!isMissingRpc(opened.error.message)) {
        return NextResponse.json(
          { error: opened.error.message },
          { status: 500 },
        );
      }
      notes.push(opened.error.message);
    } else {
      openedCount = opened.data ?? 0;
    }

    const closed = await supabase.rpc("close_expired_listings");
    if (closed.error) {
      return NextResponse.json({ error: closed.error.message }, { status: 500 });
    }

    let winnerEmails = 0;
    let notifyError: string | undefined;
    try {
      const winners = await notifySoldWinners(getSiteOrigin(request));
      winnerEmails = winners.sent;
      notifyError = winners.error;
    } catch (err) {
      notifyError = err instanceof Error ? err.message : "notify failed";
    }

    try {
      revalidatePath("/");
      revalidatePath("/auctions");
    } catch {
      notes.push("revalidatePath skipped");
    }

    return NextResponse.json({
      opened: openedCount,
      closed: closed.data ?? 0,
      winnerEmails,
      notifyError: notifyError ?? null,
      notes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return tickListings(request);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return tickListings(request);
}
