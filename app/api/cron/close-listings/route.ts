import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function closeExpiredListings() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("close_expired_listings");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/auctions");
  return NextResponse.json({ closed: data ?? 0 });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return closeExpiredListings();
}
