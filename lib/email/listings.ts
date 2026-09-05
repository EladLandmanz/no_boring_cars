import { getSiteOrigin } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send";
import { formatIls } from "@/lib/money";
import {
  insertNotification,
  insertReviewNotifications,
} from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

async function emailForUser(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user?.email) {
    return null;
  }
  return data.user.email;
}

function adminRecipients() {
  return (process.env.EMAIL_ADMIN_TO ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function notifyAdminsOfReview(listing: {
  id: string;
  slug: string;
  headline: string;
}) {
  await insertReviewNotifications(listing);

  const to = adminRecipients();
  if (to.length === 0) {
    return;
  }

  const origin = getSiteOrigin();
  const adminUrl = `${origin}/admin`;
  const previewUrl = `${origin}/auctions/${listing.slug}`;

  await sendEmail({
    to,
    subject: `Review: ${listing.headline}`,
    text: `A listing was submitted for review.\n\n${listing.headline}\n${previewUrl}\n\nAdmin: ${adminUrl}\n`,
    html: `<p>A listing was submitted for review.</p>
<p><strong>${escapeHtml(listing.headline)}</strong></p>
<p><a href="${previewUrl}">Preview</a> · <a href="${adminUrl}">Admin</a></p>`,
  });
}

export async function notifySoldWinners(siteOrigin: string) {
  const supabase = createAdminClient();
  const { data: lots, error } = await supabase
    .from("listings")
    .select("id, slug, headline, sold_price_agorot, winner_id, seller_id, won_email_sent_at")
    .eq("status", "sold")
    .not("winner_id", "is", null);

  if (error || !lots?.length) {
    return { sent: 0, error: error?.message };
  }

  const origin = siteOrigin.replace(/\/$/, "");
  let sent = 0;

  for (const lot of lots) {
    const winnerId = lot.winner_id as string;
    const price =
      lot.sold_price_agorot != null ? formatIls(lot.sold_price_agorot) : "";
    const url = `${origin}/auctions/${lot.slug}`;

    await insertNotification({
      user_id: winnerId,
      kind: "won",
      listing_id: lot.id,
      title: "You won an auction",
      body: price
        ? `${lot.headline} · ${price}`
        : lot.headline,
      href: `/auctions/${lot.slug}`,
    });

    if (lot.seller_id && lot.seller_id !== winnerId) {
      await insertNotification({
        user_id: lot.seller_id as string,
        kind: "sold",
        listing_id: lot.id,
        title: "Your car sold",
        body: price
          ? `${lot.headline} · ${price}`
          : lot.headline,
        href: `/auctions/${lot.slug}`,
      });
    }

    if (!process.env.RESEND_API_KEY || lot.won_email_sent_at) {
      continue;
    }

    const winnerEmail = await emailForUser(winnerId);
    let delivered = false;

    if (winnerEmail) {
      const result = await sendEmail({
        to: winnerEmail,
        subject: `You won: ${lot.headline}`,
        text: `You won this auction${price ? ` for ${price}` : ""}.\n\n${lot.headline}\n${url}\n`,
        html: `<p>You won this auction${price ? ` for <strong>${escapeHtml(price)}</strong>` : ""}.</p>
<p><strong>${escapeHtml(lot.headline)}</strong></p>
<p><a href="${url}">View the listing</a></p>`,
      });
      delivered = result.ok;
    }

    const admins = adminRecipients();
    if (admins.length > 0) {
      await sendEmail({
        to: admins,
        subject: `Winner (forward if needed): ${lot.headline}`,
        text: `In-app alert was created for the winner.\nWinner email: ${winnerEmail ?? "(none)"}\n${lot.headline}\n${url}\n`,
        html: `<p>In-app alert was created for the winner.</p>
<p>Winner email: <strong>${escapeHtml(winnerEmail ?? "(none)")}</strong></p>
<p><strong>${escapeHtml(lot.headline)}</strong></p>
<p><a href="${url}">View the listing</a></p>
<p>Resend can only deliver to your own inbox until a domain is verified. Forward this to the winner for a demo.</p>`,
      });
    }

    await supabase
      .from("listings")
      .update({ won_email_sent_at: new Date().toISOString() })
      .eq("id", lot.id)
      .is("won_email_sent_at", null);
    if (delivered) {
      sent += 1;
    }
  }

  return { sent };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
