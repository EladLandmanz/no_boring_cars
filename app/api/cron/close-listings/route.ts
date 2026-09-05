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

async function tickListings(request: Request) {
  try {
    const supabase = createAdminClient();

    const opened = await supabase.rpc("open_due_listings");
    if (opened.error) {
      return NextResponse.json({ error: opened.error.message }, { status: 500 });
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

    revalidatePath("/");
    revalidatePath("/auctions");
    return NextResponse.json({
      opened: opened.data ?? 0,
      closed: closed.data ?? 0,
      winnerEmails,
      notifyError: notifyError ?? null,
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
